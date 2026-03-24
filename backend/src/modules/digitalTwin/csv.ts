import { readFile } from "node:fs/promises";
import { isAbsolute } from "node:path";
import type { DigitalTwinSimulationInput, DigitalTwinSimulationOutput } from "./ml.js";

const REQUIRED_HEADERS = [
  "demand_change",
  "staff",
  "price_change",
  "inventory_level",
  "wait_time",
  "revenue",
  "staff_utilisation",
  "inventory_usage",
] as const;

type RequiredHeader = (typeof REQUIRED_HEADERS)[number];

function parseNumber(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function loadDigitalTwinTrainingSamplesFromCsv(path: string): Promise<
  Array<{ input: DigitalTwinSimulationInput; output: DigitalTwinSimulationOutput }>
> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (err) {
    // Common misconfig: running backend from `backend/` but setting `backend/data/...`
    if (!isAbsolute(path) && (path.startsWith("backend/") || path.startsWith("backend\\"))) {
      raw = await readFile(path.slice("backend/".length), "utf8");
    } else {
      throw err;
    }
  }
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim());
  const indexByHeader = new Map<string, number>();
  for (let i = 0; i < header.length; i++) {
    indexByHeader.set(header[i], i);
  }

  for (const h of REQUIRED_HEADERS) {
    if (!indexByHeader.has(h)) {
      throw new Error(`Training CSV missing required column: ${h}`);
    }
  }

  const samples: Array<{ input: DigitalTwinSimulationInput; output: DigitalTwinSimulationOutput }> = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const get = (h: RequiredHeader) => cols[indexByHeader.get(h) ?? -1] ?? "";

    const demand_change = parseNumber(get("demand_change"));
    const staff = parseNumber(get("staff"));
    const price_change = parseNumber(get("price_change"));
    const inventory_level = parseNumber(get("inventory_level"));
    const wait_time = parseNumber(get("wait_time"));
    const revenue = parseNumber(get("revenue"));
    const staff_utilisation = parseNumber(get("staff_utilisation"));
    const inventory_usage = parseNumber(get("inventory_usage"));

    if (
      demand_change === null ||
      staff === null ||
      price_change === null ||
      inventory_level === null ||
      wait_time === null ||
      revenue === null ||
      staff_utilisation === null ||
      inventory_usage === null
    ) {
      continue;
    }

    samples.push({
      input: {
        demand_change,
        staff,
        price_change,
        inventory_level,
      },
      output: {
        wait_time,
        revenue,
        staff_utilisation,
        inventory_usage,
      },
    });
  }

  return samples;
}
