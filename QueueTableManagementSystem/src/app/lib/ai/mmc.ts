export type MmcMetrics = {
  lambdaPerMin: number;
  muPerMin: number;
  servers: number;
  utilization: number;
  pWait: number;
  wqMinutes: number;
};

function factorial(n: number) {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

// Erlang C (probability an arrival must wait).
function erlangC(lambdaPerMin: number, muPerMin: number, servers: number) {
  if (servers <= 0) return 1;
  if (muPerMin <= 0) return 1;
  const a = lambdaPerMin / muPerMin;
  const rho = a / servers;
  if (rho >= 1) return 1;

  let sum = 0;
  for (let k = 0; k < servers; k++) {
    sum += (a ** k) / factorial(k);
  }
  const last = (a ** servers) / (factorial(servers) * (1 - rho));
  const p0 = 1 / (sum + last);
  return last * p0;
}

export function mmcWaitTime(lambdaPerMin: number, muPerMin: number, servers: number): MmcMetrics {
  const epsilon = 1e-9;
  const safeLambda = Math.max(0, lambdaPerMin);
  const safeMu = Math.max(epsilon, muPerMin);
  const safeServers = Math.max(0, Math.floor(servers));
  const utilization = safeServers === 0 ? 1 : safeLambda / (safeServers * safeMu);

  const pWait = erlangC(safeLambda, safeMu, safeServers);
  const denom = safeServers * safeMu - safeLambda;
  const wqMinutes = denom <= 0 ? 60 : pWait / denom;

  return {
    lambdaPerMin: safeLambda,
    muPerMin: safeMu,
    servers: safeServers,
    utilization,
    pWait,
    wqMinutes,
  };
}

