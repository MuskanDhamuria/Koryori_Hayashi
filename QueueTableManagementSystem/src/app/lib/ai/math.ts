export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function sum(values: number[]) {
  return values.reduce((acc, v) => acc + v, 0);
}

export function mean(values: number[]) {
  return values.length === 0 ? 0 : sum(values) / values.length;
}

export function dot(a: number[], b: number[]) {
  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i] * b[i];
  return total;
}

export function matVecMul(matrix: number[][], vector: number[]) {
  return matrix.map(row => dot(row, vector));
}

export function identity(size: number) {
  const matrix: number[][] = [];
  for (let i = 0; i < size; i++) {
    const row = new Array(size).fill(0);
    row[i] = 1;
    matrix.push(row);
  }
  return matrix;
}

// Gaussian elimination with partial pivoting.
export function solveLinearSystem(matrix: number[][], vector: number[]) {
  const n = matrix.length;
  const a = matrix.map(r => [...r]);
  const b = [...vector];

  for (let i = 0; i < n; i++) {
    let pivotRow = i;
    let pivotValue = Math.abs(a[i][i]);
    for (let r = i + 1; r < n; r++) {
      const value = Math.abs(a[r][i]);
      if (value > pivotValue) {
        pivotValue = value;
        pivotRow = r;
      }
    }

    if (pivotValue === 0) return null;

    if (pivotRow !== i) {
      [a[i], a[pivotRow]] = [a[pivotRow], a[i]];
      [b[i], b[pivotRow]] = [b[pivotRow], b[i]];
    }

    const pivot = a[i][i];
    for (let c = i; c < n; c++) a[i][c] /= pivot;
    b[i] /= pivot;

    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const factor = a[r][i];
      if (factor === 0) continue;
      for (let c = i; c < n; c++) a[r][c] -= factor * a[i][c];
      b[r] -= factor * b[i];
    }
  }

  return b;
}

