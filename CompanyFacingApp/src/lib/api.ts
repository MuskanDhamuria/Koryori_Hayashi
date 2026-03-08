import type { ApiResponse, AppState, AuthSessionResponse, SpreadsheetSyncConfig, SpreadsheetSyncStatus } from '../types';

async function requestJson<T>(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || `Request failed with status ${response.status}`);
  }

  return payload.data;
}

export function fetchSession() {
  return requestJson<AuthSessionResponse>('/api/auth/session');
}

export function registerFirstUser(payload: { name: string; email: string; password: string }) {
  return requestJson<AuthSessionResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function login(payload: { email: string; password: string }) {
  return requestJson<AuthSessionResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function logout() {
  return requestJson<boolean>('/api/auth/logout', {
    method: 'POST',
  });
}

export function fetchDashboard() {
  return requestJson<AppState>('/api/dashboard');
}

export function saveDashboard(state: AppState) {
  return requestJson<AppState>('/api/dashboard', {
    method: 'PUT',
    body: JSON.stringify({ state }),
  });
}

export function resetDashboard() {
  return requestJson<AppState>('/api/dashboard/reset', {
    method: 'POST',
  });
}

export function fetchSpreadsheetStatus() {
  return requestJson<SpreadsheetSyncStatus>('/api/integrations/spreadsheet/status');
}

export function startSpreadsheetWatch(config: SpreadsheetSyncConfig) {
  return requestJson<SpreadsheetSyncStatus>('/api/integrations/spreadsheet/watch', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export function stopSpreadsheetWatch() {
  return requestJson<SpreadsheetSyncStatus>('/api/integrations/spreadsheet/watch', {
    method: 'DELETE',
  });
}
