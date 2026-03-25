import { mean, solveLinearSystem } from './math';

export type Arima210Model = {
  kind: 'arima-2-1-0';
  intercept: number;
  phi1: number;
  phi2: number;
  lastOriginal: number;
  lastDiff1: number;
  lastDiff2: number;
  residualStd: number;
};

function differenceOnce(series: number[]) {
  const diff: number[] = [];
  for (let i = 1; i < series.length; i++) diff.push(series[i] - series[i - 1]);
  return diff;
}

function fitAr2(diffSeries: number[]) {
  // diff[t] = c + phi1 * diff[t-1] + phi2 * diff[t-2] + e
  // Ridge-stabilized normal equations for small data.
  const rows: number[][] = [];
  const ys: number[] = [];

  for (let t = 2; t < diffSeries.length; t++) {
    rows.push([1, diffSeries[t - 1], diffSeries[t - 2]]);
    ys.push(diffSeries[t]);
  }

  if (rows.length < 5) return null;

  const xtx = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const xty = [0, 0, 0];

  for (let r = 0; r < rows.length; r++) {
    const x = rows[r];
    const y = ys[r];
    for (let i = 0; i < 3; i++) {
      xty[i] += x[i] * y;
      for (let j = 0; j < 3; j++) xtx[i][j] += x[i] * x[j];
    }
  }

  const ridge = 1e-6;
  xtx[0][0] += ridge;
  xtx[1][1] += ridge;
  xtx[2][2] += ridge;

  const beta = solveLinearSystem(xtx, xty);
  if (!beta) return null;
  return { intercept: beta[0], phi1: beta[1], phi2: beta[2] };
}

export function fitArima210(series: number[]): Arima210Model | null {
  if (series.length < 12) return null;

  const diff = differenceOnce(series);
  const ar = fitAr2(diff);
  if (!ar) return null;

  const residuals: number[] = [];
  for (let t = 2; t < diff.length; t++) {
    const predicted = ar.intercept + ar.phi1 * diff[t - 1] + ar.phi2 * diff[t - 2];
    residuals.push(diff[t] - predicted);
  }

  const residualMean = mean(residuals);
  const residualVar = residuals.length === 0
    ? 1
    : residuals.reduce((acc, r) => acc + (r - residualMean) ** 2, 0) / residuals.length;

  return {
    kind: 'arima-2-1-0',
    intercept: ar.intercept,
    phi1: ar.phi1,
    phi2: ar.phi2,
    lastOriginal: series[series.length - 1],
    lastDiff1: diff[diff.length - 1],
    lastDiff2: diff[diff.length - 2] ?? 0,
    residualStd: Math.sqrt(Math.max(1e-6, residualVar)),
  };
}

export function forecastArima210(model: Arima210Model, steps: number) {
  let lastOriginal = model.lastOriginal;
  let d1 = model.lastDiff1;
  let d2 = model.lastDiff2;

  const forecasts: number[] = [];
  for (let i = 0; i < steps; i++) {
    const nextDiff = model.intercept + model.phi1 * d1 + model.phi2 * d2;
    const nextOriginal = lastOriginal + nextDiff;
    forecasts.push(nextOriginal);
    lastOriginal = nextOriginal;
    d2 = d1;
    d1 = nextDiff;
  }
  return forecasts;
}

