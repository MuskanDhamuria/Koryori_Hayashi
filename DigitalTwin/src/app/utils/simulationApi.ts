

export interface SimulationInput {
  demand_change: number;
  staff: number;
  price_change: number;
  inventory_level: number;
  engine?: SimulationEngine;
  record_run?: boolean;
}

export type SimulationEngine = "rules" | "ml";

export interface MlInfo {
  sample_count: number;
  metrics: Record<
    "wait_time" | "revenue" | "staff_utilisation" | "inventory_usage",
    { rmse: number; r2: number }
  >;
}

export interface SimulationResult {
  wait_time: number;
  revenue: number;
  staff_utilisation: number;
  inventory_usage: number;
  recommendations: string[];
  engine_requested?: SimulationEngine;
  engine_used?: SimulationEngine;
  ml_info?: MlInfo;
}

function getApiBaseUrl() {
  const apiUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  return apiUrl?.trim() ? apiUrl.trim().replace(/\/+$/, "") : "http://localhost:4000";
}

export async function runSimulation(input: SimulationInput): Promise<SimulationResult> {
  const baseUrl = getApiBaseUrl();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${baseUrl}/api/digital-twin/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorDetail = "";
      try {
        const data = (await response.json()) as { message?: string };
        errorDetail = data?.message ? `: ${data.message}` : "";
      } catch {
        // ignore
      }

      throw new Error(`Simulation API call failed (${response.status})${errorDetail}`);
    }

    return (await response.json()) as SimulationResult;
  } finally {
    clearTimeout(timeout);
  }
}
