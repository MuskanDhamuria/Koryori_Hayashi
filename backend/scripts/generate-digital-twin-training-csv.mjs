import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

function parseArgs(argv) {
  const args = {
    out: "",
    rows: 500,
    seed: 42,
    noise: 0.05,
  };

  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--out") {
      args.out = argv[++i] ?? "";
      continue;
    }
    if (token === "--rows") {
      args.rows = Number(argv[++i] ?? args.rows);
      continue;
    }
    if (token === "--seed") {
      args.seed = Number(argv[++i] ?? args.seed);
      continue;
    }
    if (token === "--noise") {
      args.noise = Number(argv[++i] ?? args.noise);
      continue;
    }
    if (token === "--help" || token === "-h") {
      printHelpAndExit(0);
    }
  }

  if (!Number.isFinite(args.rows) || args.rows <= 0) {
    throw new Error("--rows must be a positive number");
  }
  if (!Number.isFinite(args.seed)) {
    throw new Error("--seed must be a number");
  }
  if (!Number.isFinite(args.noise) || args.noise < 0 || args.noise > 1) {
    throw new Error("--noise must be between 0 and 1");
  }

  return args;
}

function printHelpAndExit(code) {
  // eslint-disable-next-line no-console
  console.log(
    [
      "Generate mock training data for the Digital Twin ML surrogate model.",
      "",
      "Usage:",
      "  node scripts/generate-digital-twin-training-csv.mjs --out backend/data/digital-twin-mock-training.csv",
      "",
      "Options:",
      "  --out <path>   Output CSV path (default: stdout)",
      "  --rows <n>     Number of rows (default: 500)",
      "  --seed <n>     RNG seed (default: 42)",
      "  --noise <0..1> Add proportional noise to outputs (default: 0.05)",
      "",
      "CSV columns:",
      "  demand_change,staff,price_change,inventory_level,wait_time,revenue,staff_utilisation,inventory_usage",
    ].join("\n"),
  );
  process.exit(code);
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randStep(rng, min, max, step) {
  const steps = Math.floor((max - min) / step);
  return min + step * randInt(rng, 0, steps);
}

function computeRuleBasedOutput(input) {
  const demandMultiplier = 1 + input.demand_change / 100;
  const priceMultiplier = 1 + input.price_change / 100;

  const staffingFactor = Math.pow(input.baseline_staff_count / Math.max(1, input.staff), 0.7);

  const waitTime = Math.max(
    1,
    Math.round(input.base_wait_time_minutes * demandMultiplier * staffingFactor),
  );
  const revenue = Math.max(
    0,
    Math.round(input.base_revenue_per_day * demandMultiplier * priceMultiplier),
  );

  const staffUtilisation = clamp(
    Math.round(
      input.base_staff_utilisation *
        demandMultiplier *
        (input.baseline_staff_count / Math.max(1, input.staff)),
    ),
    0,
    100,
  );

  const inventoryLevelNormalized = clamp(input.inventory_level, 0, 100) / 100;
  const inventoryLevelFactor = 1.4 - 1.2 * inventoryLevelNormalized;
  const stockoutRisk = clamp(
    Math.round(input.base_stockout_risk * demandMultiplier * inventoryLevelFactor),
    0,
    100,
  );

  return {
    wait_time: waitTime,
    revenue,
    staff_utilisation: staffUtilisation,
    inventory_usage: stockoutRisk,
  };
}

function applyNoise(rng, value, proportion) {
  if (proportion <= 0) return value;
  const delta = (rng() * 2 - 1) * proportion * Math.max(1, Math.abs(value));
  return value + delta;
}

function main() {
  const args = parseArgs(process.argv);
  const rng = mulberry32(args.seed);

  const header =
    "demand_change,staff,price_change,inventory_level,base_wait_time_minutes,base_revenue_per_day,base_stockout_risk,base_staff_utilisation,baseline_staff_count,wait_time,revenue,staff_utilisation,inventory_usage";
  const lines = [header];

  for (let i = 0; i < args.rows; i++) {
    const input = {
      demand_change: randStep(rng, -50, 50, 5),
      staff: randInt(rng, 1, 20),
      price_change: randStep(rng, -30, 30, 5),
      inventory_level: randStep(rng, 0, 100, 5),
      base_wait_time_minutes: randStep(rng, 8, 28, 1),
      base_revenue_per_day: randInt(rng, 500, 6000),
      base_stockout_risk: randStep(rng, 10, 80, 1),
      base_staff_utilisation: randStep(rng, 50, 85, 1),
      baseline_staff_count: randInt(rng, 3, 12),
    };

    const out = computeRuleBasedOutput(input);
    const noisy = {
      wait_time: clamp(Math.round(applyNoise(rng, out.wait_time, args.noise)), 1, 180),
      revenue: clamp(Math.round(applyNoise(rng, out.revenue, args.noise)), 0, 1_000_000_000),
      staff_utilisation: clamp(
        Math.round(applyNoise(rng, out.staff_utilisation, args.noise)),
        0,
        100,
      ),
      inventory_usage: clamp(Math.round(applyNoise(rng, out.inventory_usage, args.noise)), 0, 100),
    };

    lines.push(
      [
        input.demand_change,
        input.staff,
        input.price_change,
        input.inventory_level,
        input.base_wait_time_minutes,
        input.base_revenue_per_day,
        input.base_stockout_risk,
        input.base_staff_utilisation,
        input.baseline_staff_count,
        noisy.wait_time,
        noisy.revenue,
        noisy.staff_utilisation,
        noisy.inventory_usage,
      ].join(","),
    );
  }

  const csv = lines.join("\n") + "\n";

  if (args.out) {
    mkdirSync(dirname(args.out), { recursive: true });
    writeFileSync(args.out, csv, "utf8");
    // eslint-disable-next-line no-console
    console.log(`Wrote ${args.rows} rows to ${args.out}`);
    return;
  }

  process.stdout.write(csv);
}

try {
  main();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(err?.message ?? err);
  printHelpAndExit(1);
}
