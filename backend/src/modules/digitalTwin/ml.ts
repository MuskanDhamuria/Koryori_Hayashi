export type DigitalTwinSimulationLevers = {
  demand_change: number;
  staff: number;
  price_change: number;
  inventory_level: number;
};

export type DigitalTwinBaselineSnapshot = {
  base_wait_time_minutes: number;
  base_revenue_per_day: number;
  base_stockout_risk: number;
  base_staff_utilisation: number;
  baseline_staff_count: number;
};

export type DigitalTwinModelInput = DigitalTwinSimulationLevers & DigitalTwinBaselineSnapshot;

export type DigitalTwinSimulationOutput = {
  wait_time: number;
  revenue: number;
  staff_utilisation: number;
  inventory_usage: number;
};

export type DigitalTwinMlMetric = {
  rmse: number;
  r2: number;
};

export type DigitalTwinMlInfo = {
  sample_count: number;
  metrics: Record<keyof DigitalTwinSimulationOutput, DigitalTwinMlMetric>;
};

type TrainedModel = {
  mean: number[];
  std: number[];
  weights: Record<keyof DigitalTwinSimulationOutput, number[]>;
  metrics: Record<keyof DigitalTwinSimulationOutput, DigitalTwinMlMetric>;
  sampleCount: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundNumber(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function safeStd(value: number) {
  return value > 1e-9 ? value : 1;
}

function solveLinearSystem(
  matrix: number[][],
  vector: number[],
): number[] | null {
  const n = matrix.length;
  if (n === 0 || vector.length !== n) return null;
  if (matrix.some((row) => row.length !== n)) return null;

  const augmented = matrix.map((row, i) => [...row, vector[i]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[pivotRow][col])) {
        pivotRow = row;
      }
    }

    const pivotValue = augmented[pivotRow][col];
    if (!Number.isFinite(pivotValue) || Math.abs(pivotValue) < 1e-12) {
      return null;
    }

    if (pivotRow !== col) {
      const tmp = augmented[col];
      augmented[col] = augmented[pivotRow];
      augmented[pivotRow] = tmp;
    }

    const divisor = augmented[col][col];
    for (let k = col; k <= n; k++) {
      augmented[col][k] /= divisor;
    }

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = augmented[row][col];
      if (!factor) continue;
      for (let k = col; k <= n; k++) {
        augmented[row][k] -= factor * augmented[col][k];
      }
    }
  }

  return augmented.map((row) => row[n]);
}

function fitRidgeRegression(
  X: number[][],
  y: number[],
  lambda: number,
): number[] | null {
  const n = X.length;
  if (n === 0 || y.length !== n) return null;

  const d = X[0]?.length ?? 0;
  if (d === 0) return null;
  if (X.some((row) => row.length !== d)) return null;

  const XtX: number[][] = Array.from({ length: d }, () =>
    Array.from({ length: d }, () => 0),
  );
  const Xty: number[] = Array.from({ length: d }, () => 0);

  for (let i = 0; i < n; i++) {
    const row = X[i];
    const yi = y[i];
    for (let a = 0; a < d; a++) {
      Xty[a] += row[a] * yi;
      for (let b = 0; b < d; b++) {
        XtX[a][b] += row[a] * row[b];
      }
    }
  }

  for (let i = 1; i < d; i++) {
    XtX[i][i] += lambda;
  }

  return solveLinearSystem(XtX, Xty);
}

function predictFromWeights(X: number[][], weights: number[]) {
  return X.map((row) => row.reduce((sum, value, idx) => sum + value * weights[idx], 0));
}

function regressionMetrics(y: number[], yHat: number[]): DigitalTwinMlMetric {
  const n = y.length;
  if (n === 0 || yHat.length !== n) {
    return { rmse: Number.NaN, r2: Number.NaN };
  }

  const mean = y.reduce((sum, v) => sum + v, 0) / n;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const residual = y[i] - yHat[i];
    ssRes += residual * residual;
    const diff = y[i] - mean;
    ssTot += diff * diff;
  }

  const rmse = Math.sqrt(ssRes / n);
  const r2 = ssTot < 1e-9 ? 0 : 1 - ssRes / ssTot;

  return { rmse: roundNumber(rmse, 3), r2: roundNumber(r2, 3) };
}

function standardizeFeatures(rows: number[][]) {
  const n = rows.length;
  const d = rows[0]?.length ?? 0;

  const mean = Array.from({ length: d }, () => 0);
  const variance = Array.from({ length: d }, () => 0);

  for (const row of rows) {
    for (let j = 0; j < d; j++) {
      mean[j] += row[j];
    }
  }
  for (let j = 0; j < d; j++) {
    mean[j] /= Math.max(1, n);
  }

  for (const row of rows) {
    for (let j = 0; j < d; j++) {
      const diff = row[j] - mean[j];
      variance[j] += diff * diff;
    }
  }
  for (let j = 0; j < d; j++) {
    variance[j] /= Math.max(1, n);
  }

  const std = variance.map((v) => safeStd(Math.sqrt(v)));
  const standardized = rows.map((row) => row.map((v, j) => (v - mean[j]) / std[j]));

  return { standardized, mean, std };
}

function toFeatureRow(input: DigitalTwinModelInput): [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
] {
  return [
    input.demand_change,
    input.staff,
    input.price_change,
    input.inventory_level,
    input.base_wait_time_minutes,
    input.base_revenue_per_day,
    input.base_stockout_risk,
    input.base_staff_utilisation,
    input.baseline_staff_count,
  ];
}

export function trainDigitalTwinSurrogateModel(
  samples: Array<{ input: DigitalTwinModelInput; output: DigitalTwinSimulationOutput }>,
): { model: TrainedModel; info: DigitalTwinMlInfo } | null {
  const minSamples = 20;
  if (samples.length < minSamples) return null;

  const featureRows = samples.map((sample) => toFeatureRow(sample.input));
  const { standardized, mean, std } = standardizeFeatures(featureRows);

  const X = standardized.map((row) => [1, ...row]);
  const lambda = 1e-3;

  const outputs: Array<keyof DigitalTwinSimulationOutput> = [
    "wait_time",
    "revenue",
    "staff_utilisation",
    "inventory_usage",
  ];

  const weights = {} as Record<keyof DigitalTwinSimulationOutput, number[]>;
  const metrics = {} as Record<keyof DigitalTwinSimulationOutput, DigitalTwinMlMetric>;

  for (const key of outputs) {
    const y = samples.map((sample) => sample.output[key]);
    const w = fitRidgeRegression(X, y, lambda);
    if (!w) return null;
    weights[key] = w;
    metrics[key] = regressionMetrics(y, predictFromWeights(X, w));
  }

  const model: TrainedModel = {
    mean,
    std,
    weights,
    metrics,
    sampleCount: samples.length,
  };

  const info: DigitalTwinMlInfo = {
    sample_count: samples.length,
    metrics,
  };

  return { model, info };
}

export function predictWithDigitalTwinSurrogateModel(
  trained: TrainedModel,
  input: DigitalTwinModelInput,
): DigitalTwinSimulationOutput {
  const raw = toFeatureRow(input);
  const standardized = raw.map((v, i) => (v - (trained.mean[i] ?? 0)) / (trained.std[i] ?? 1));
  const x = [1, ...standardized];

  const predict = (key: keyof DigitalTwinSimulationOutput) =>
    x.reduce((sum, value, idx) => sum + value * trained.weights[key][idx], 0);

  const waitTime = clamp(Math.round(predict("wait_time")), 1, 180);
  const revenue = clamp(Math.round(predict("revenue")), 0, 1_000_000_000);
  const staffUtilisation = clamp(Math.round(predict("staff_utilisation")), 0, 100);
  const inventoryUsage = clamp(Math.round(predict("inventory_usage")), 0, 100);

  return {
    wait_time: waitTime,
    revenue,
    staff_utilisation: staffUtilisation,
    inventory_usage: inventoryUsage,
  };
}
