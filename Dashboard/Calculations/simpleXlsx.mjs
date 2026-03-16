import { readFile } from "node:fs/promises";
import { inflateRawSync } from "node:zlib";

function readUInt32LE(buffer, offset) {
  return buffer.readUInt32LE(offset);
}

function readUInt16LE(buffer, offset) {
  return buffer.readUInt16LE(offset);
}

function findEndOfCentralDirectory(buffer) {
  const signature = 0x06054b50;
  const maxCommentLength = 0xffff;
  const minSize = 22;
  const searchStart = Math.max(0, buffer.length - (minSize + maxCommentLength));
  for (let offset = buffer.length - minSize; offset >= searchStart; offset -= 1) {
    if (readUInt32LE(buffer, offset) === signature) {
      return offset;
    }
  }
  return null;
}

function parseCentralDirectory(buffer) {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  if (eocdOffset === null) {
    throw new Error("Invalid XLSX: missing end of central directory");
  }

  const centralDirectorySize = readUInt32LE(buffer, eocdOffset + 12);
  const centralDirectoryOffset = readUInt32LE(buffer, eocdOffset + 16);
  const end = centralDirectoryOffset + centralDirectorySize;

  const entries = new Map();
  let offset = centralDirectoryOffset;
  const signature = 0x02014b50;

  while (offset + 46 <= end) {
    if (readUInt32LE(buffer, offset) !== signature) {
      break;
    }

    const compressionMethod = readUInt16LE(buffer, offset + 10);
    const compressedSize = readUInt32LE(buffer, offset + 20);
    const fileNameLength = readUInt16LE(buffer, offset + 28);
    const extraFieldLength = readUInt16LE(buffer, offset + 30);
    const fileCommentLength = readUInt16LE(buffer, offset + 32);
    const localHeaderOffset = readUInt32LE(buffer, offset + 42);

    const fileNameStart = offset + 46;
    const fileNameEnd = fileNameStart + fileNameLength;
    const fileName = buffer.toString("utf8", fileNameStart, fileNameEnd);

    entries.set(fileName, {
      compressionMethod,
      compressedSize,
      localHeaderOffset,
    });

    offset = fileNameEnd + extraFieldLength + fileCommentLength;
  }

  return entries;
}

function extractZipEntry(buffer, entry) {
  const localSignature = 0x04034b50;
  const localOffset = entry.localHeaderOffset;
  if (readUInt32LE(buffer, localOffset) !== localSignature) {
    throw new Error("Invalid XLSX: missing local file header");
  }

  const fileNameLength = readUInt16LE(buffer, localOffset + 26);
  const extraFieldLength = readUInt16LE(buffer, localOffset + 28);
  const dataStart = localOffset + 30 + fileNameLength + extraFieldLength;
  const dataEnd = dataStart + entry.compressedSize;

  const compressed = buffer.subarray(dataStart, dataEnd);
  if (entry.compressionMethod === 0) {
    return Buffer.from(compressed);
  }
  if (entry.compressionMethod === 8) {
    return inflateRawSync(compressed);
  }

  throw new Error(`Unsupported XLSX compression method: ${entry.compressionMethod}`);
}

function decodeXmlEntities(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function parseSharedStrings(xml) {
  const strings = [];
  const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let siMatch = null;
  while ((siMatch = siRegex.exec(xml)) !== null) {
    const siBody = siMatch[1];
    const tRegex = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
    let tMatch = null;
    let joined = "";
    while ((tMatch = tRegex.exec(siBody)) !== null) {
      joined += tMatch[1];
    }
    strings.push(decodeXmlEntities(joined));
  }
  return strings;
}

function parseWorksheetCells(xml, sharedStrings) {
  const cellMap = new Map();
  const cellRegex = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
  let match = null;

  while ((match = cellRegex.exec(xml)) !== null) {
    const attrs = match[1];
    const body = match[2] ?? null;
    if (body === null) {
      continue;
    }

    const refMatch = /\br="([^"]+)"/.exec(attrs);
    if (!refMatch) {
      continue;
    }
    const cellRef = refMatch[1];

    const typeMatch = /\bt="([^"]+)"/.exec(attrs);
    const cellType = typeMatch?.[1] ?? null;

    const vMatch = /<v>([^<]*)<\/v>/.exec(body);
    const inlineMatch = /<is>[\s\S]*?<t\b[^>]*>([\s\S]*?)<\/t>[\s\S]*?<\/is>/.exec(body);
    const rawValue = vMatch?.[1] ?? inlineMatch?.[1] ?? null;
    if (rawValue === null) {
      continue;
    }

    if (cellType === "s") {
      const index = Number(rawValue);
      const shared = Number.isFinite(index) ? sharedStrings[index] : undefined;
      if (typeof shared === "string") {
        cellMap.set(cellRef, shared);
      }
      continue;
    }

    if (cellType === "inlineStr") {
      cellMap.set(cellRef, decodeXmlEntities(rawValue));
      continue;
    }

    const numeric = Number(rawValue);
    cellMap.set(cellRef, Number.isFinite(numeric) ? numeric : decodeXmlEntities(rawValue));
  }

  return cellMap;
}

export async function readXlsxXmlParts(xlsxPath) {
  const buffer = await readFile(xlsxPath);
  const entries = parseCentralDirectory(buffer);

  const sharedEntry = entries.get("xl/sharedStrings.xml");
  const sheetEntry = entries.get("xl/worksheets/sheet1.xml");
  if (!sharedEntry || !sheetEntry) {
    throw new Error("Unsupported XLSX: missing required worksheet files");
  }

  const sharedXml = extractZipEntry(buffer, sharedEntry).toString("utf8");
  const sheetXml = extractZipEntry(buffer, sheetEntry).toString("utf8");

  return { sharedXml, sheetXml };
}

export async function readXlsxSharedStrings(xlsxPath) {
  const { sharedXml } = await readXlsxXmlParts(xlsxPath);
  return parseSharedStrings(sharedXml);
}

export async function readXlsxSheet1Cells(xlsxPath) {
  const { sharedXml, sheetXml } = await readXlsxXmlParts(xlsxPath);
  const strings = parseSharedStrings(sharedXml);
  return parseWorksheetCells(sheetXml, strings);
}
