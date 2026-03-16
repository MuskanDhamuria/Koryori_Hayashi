import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { readXlsxSheet1Cells } from "./simpleXlsx.mjs";

function round2(value) {
  return Number(Number(value).toFixed(2));
}

function excelSerialDateToUtc(serial) {
  const base = Date.UTC(1899, 11, 30);
  return new Date(base + serial * 24 * 60 * 60 * 1000);
}

function formatMonthYearUtc(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function timeFractionToHour(fraction) {
  if (!Number.isFinite(fraction)) {
    return null;
  }
  return Math.max(0, Math.min(23, Math.floor(fraction * 24 + 1e-6)));
}

function cellNumber(cells, ref) {
  const value = cells.get(ref);
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function cellString(cells, ref) {
  const value = cells.get(ref);
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }
  return null;
}

function extractItemRows(cells) {
  const rows = [];
  for (let row = 6; row <= 80; row += 1) {
    const item = cellString(cells, `A${row}`);
    if (!item) {
      continue;
    }
    rows.push({
      item,
      quantityRank: cellNumber(cells, `B${row}`),
      amountRank: cellNumber(cells, `C${row}`),
      salesSummary: cellNumber(cells, `D${row}`) ?? 0,
    });
  }
  return rows;
}

function extractHourlyRows(cells) {
  const rows = [];
  for (let row = 6; row <= 80; row += 1) {
    const fraction = cellNumber(cells, `F${row}`);
    if (fraction === null) {
      continue;
    }

    const hour = timeFractionToHour(fraction);
    if (hour === null) {
      continue;
    }

    rows.push({
      hour,
      orders: Math.round(cellNumber(cells, `G${row}`) ?? 0),
      amount: cellNumber(cells, `H${row}`) ?? 0,
    });
  }
  return rows.sort((a, b) => a.hour - b.hour);
}

function extractMonthlyRows(cells) {
  const rows = [];
  for (let row = 6; row <= 80; row += 1) {
    const serial = cellNumber(cells, `J${row}`);
    if (serial === null) {
      continue;
    }
    const monthStartUtc = excelSerialDateToUtc(serial);
    rows.push({
      month: formatMonthYearUtc(monthStartUtc),
      rent: cellNumber(cells, `K${row}`) ?? 0,
      salary: cellNumber(cells, `L${row}`) ?? 0,
      cpfLevy: cellNumber(cells, `M${row}`) ?? 0,
      supplier: cellNumber(cells, `N${row}`) ?? 0,
      utilities: cellNumber(cells, `O${row}`) ?? 0,
      seasonParking: cellNumber(cells, `P${row}`) ?? 0,
      totalSales: cellNumber(cells, `Q${row}`) ?? 0,
      profitLoss: cellNumber(cells, `R${row}`) ?? 0,
    });
  }
  return rows.sort((a, b) => a.month.localeCompare(b.month));
}

function buildSummary(items, hourly, monthly) {
  const itemSalesTotal = round2(items.reduce((sum, row) => sum + (row.salesSummary ?? 0), 0));
  const hourlyRevenue = round2(hourly.reduce((sum, row) => sum + (row.amount ?? 0), 0));
  const hourlyOrders = hourly.reduce((sum, row) => sum + (row.orders ?? 0), 0);

  const latestMonth = monthly.at(-1) ?? null;
  const marginPercent =
    latestMonth && latestMonth.totalSales !== 0
      ? round2((latestMonth.profitLoss / latestMonth.totalSales) * 100)
      : 0;

  const peakHour = hourly.length
    ? hourly.reduce((best, current) => (current.amount >= best.amount ? current : best), hourly[0]).hour
    : null;

  return {
    itemSalesTotal,
    hourlyRevenue,
    hourlyOrders,
    avgOrderValue: hourlyOrders ? round2(hourlyRevenue / hourlyOrders) : 0,
    latestMonth,
    marginPercent,
    peakHour,
  };
}

async function main() {
  const xlsxPath = resolve("Dashboard", "data", "data.xlsx");
  const outputPath = resolve("Dashboard", "Output", "dashboardData.json");

  const cells = await readXlsxSheet1Cells(xlsxPath);

  const items = extractItemRows(cells);
  const hourly = extractHourlyRows(cells);
  const monthly = extractMonthlyRows(cells);
  const summary = buildSummary(items, hourly, monthly);

  const payload = {
    generatedAt: new Date().toISOString(),
    source: {
      xlsxPath,
      sheet: "sheet1",
    },
    tables: {
      items,
      hourly,
      monthly,
    },
    summary,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  process.stdout.write(`Wrote ${outputPath}\n`);
}

await main();

