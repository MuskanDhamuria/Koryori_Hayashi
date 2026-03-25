import { clamp, dot, identity } from './math';

export type RlsPrediction = {
  mean: number;
  std: number;
};

export class OnlineRlsRegressor {
  private weights: number[];
  private covariance: number[][];
  private residualVar = 25; // minutes^2; conservative prior
  private readonly forgetting: number;

  constructor(featureCount: number, opts?: { forgetting?: number; initialVariance?: number }) {
    this.weights = new Array(featureCount).fill(0);
    this.covariance = identity(featureCount).map(row => row.map(v => v * 1000));
    this.forgetting = opts?.forgetting ?? 0.99;
    if (opts?.initialVariance != null) this.residualVar = Math.max(1e-3, opts.initialVariance);
  }

  setPriorWeights(weights: number[]) {
    if (weights.length !== this.weights.length) return;
    this.weights = [...weights];
  }

  predict(features: number[]): RlsPrediction {
    const meanPrediction = dot(this.weights, features);
    // Approx uncertainty: residual variance + model variance proxy.
    // (We keep it simple; still data-driven as residualVar updates.)
    const std = Math.sqrt(Math.max(1e-3, this.residualVar));
    return { mean: meanPrediction, std };
  }

  update(features: number[], target: number) {
    const p = this.covariance;
    const x = features;

    // Px
    const px = new Array(x.length).fill(0);
    for (let r = 0; r < p.length; r++) {
      let acc = 0;
      for (let c = 0; c < x.length; c++) acc += p[r][c] * x[c];
      px[r] = acc;
    }

    const xTpx = dot(x, px);
    const gainDenom = this.forgetting + xTpx;
    if (gainDenom === 0) return;

    const gain = px.map(v => v / gainDenom);
    const prediction = dot(this.weights, x);
    const error = target - prediction;

    // w = w + k * e
    for (let i = 0; i < this.weights.length; i++) this.weights[i] += gain[i] * error;

    // P = (P - k x^T P) / forgetting
    const newP = p.map(row => [...row]);
    for (let r = 0; r < p.length; r++) {
      for (let c = 0; c < p.length; c++) {
        newP[r][c] = (p[r][c] - gain[r] * px[c]) / this.forgetting;
      }
    }
    this.covariance = newP;

    // Update residual variance with EWMA, bounded.
    const ewma = 0.05;
    const squared = error * error;
    this.residualVar = clamp((1 - ewma) * this.residualVar + ewma * squared, 4, 400);
  }
}

