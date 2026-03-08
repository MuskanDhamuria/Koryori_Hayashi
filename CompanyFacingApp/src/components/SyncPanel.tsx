import { useEffect, useMemo, useState } from 'react';
import { SpreadsheetEntity, SpreadsheetFileType, SpreadsheetSyncConfig, SpreadsheetSyncStatus } from '../types';

interface SyncPanelProps {
  status: SpreadsheetSyncStatus | null;
  loading: boolean;
  onStart: (config: SpreadsheetSyncConfig) => Promise<void>;
  onStop: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

const CSV_TARGET_OPTIONS: SpreadsheetEntity[] = ['salesRecords', 'menuItems', 'inventoryItems', 'recipes', 'settings'];

function inferFileType(filePath: string): SpreadsheetFileType | undefined {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.csv')) {
    return 'csv';
  }
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    return 'excel';
  }
  return undefined;
}

export function SyncPanel({ status, loading, onStart, onStop, onRefresh }: SyncPanelProps) {
  const [filePath, setFilePath] = useState(status?.filePath ?? '');
  const [csvTarget, setCsvTarget] = useState<SpreadsheetEntity>(status?.csvTarget ?? 'salesRecords');
  const fileType = useMemo(() => inferFileType(filePath) ?? status?.fileType ?? 'excel', [filePath, status?.fileType]);

  useEffect(() => {
    setFilePath(status?.filePath ?? '');
    if (status?.csvTarget) {
      setCsvTarget(status.csvTarget);
    }
  }, [status?.csvTarget, status?.filePath]);

  async function handleStart() {
    await onStart({
      filePath,
      fileType,
      csvTarget: fileType === 'csv' ? csvTarget : undefined,
    });
  }

  return (
    <div className="sync-panel">
      <div className="sync-panel__header">
        <div>
          <h3>Live spreadsheet sync</h3>
          <p>
            Watch one approved CSV or Excel file on the same laptop as the backend. When that file is saved, the backend reparses it and pushes the refreshed data into the dashboard.
          </p>
        </div>
        <span className={`status-chip ${status?.status === 'watching' ? 'status-chip--success' : status?.status === 'error' ? 'status-chip--danger' : 'status-chip--warning'}`}>
          {status?.status ?? 'idle'}
        </span>
      </div>

      <div className="form-grid">
        <label>
          Local file path
          <input
            type="text"
            value={filePath}
            onChange={(event) => setFilePath(event.target.value)}
            placeholder="/Users/name/Documents/ops-dashboard.xlsx"
          />
        </label>

        <label>
          Detected file type
          <input type="text" value={fileType} readOnly />
        </label>

        {fileType === 'csv' ? (
          <label>
            CSV target entity
            <select value={csvTarget} onChange={(event) => setCsvTarget(event.target.value as SpreadsheetEntity)}>
              {CSV_TARGET_OPTIONS.map((entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label>
          Workbook sheet names
          <input type="text" readOnly value={(status?.supportedSheets ?? []).join(', ')} />
        </label>
      </div>

      <div className="sync-panel__actions">
        <button type="button" className="button" disabled={loading || !filePath} onClick={() => void handleStart()}>
          {loading ? 'Starting…' : 'Start / restart watcher'}
        </button>
        <button type="button" className="button button--secondary" disabled={loading} onClick={() => void onRefresh()}>
          Refresh status
        </button>
        <button type="button" className="button button--ghost" disabled={loading || !status?.enabled} onClick={() => void onStop()}>
          Stop watcher
        </button>
      </div>

      <div className="sync-panel__meta">
        <div>
          <strong>Current file:</strong> {status?.filePath ?? 'Not watching any file yet'}
        </div>
        <div>
          <strong>Last sync:</strong> {status?.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : 'No sync yet'}
        </div>
        <div>
          <strong>Last error:</strong> {status?.lastError ?? 'None'}
        </div>
      </div>

      <div className="sync-panel__help">
        <strong>Expected spreadsheet structure</strong>
        <p>
          For Excel files, use sheet names like <code>menuItems</code>, <code>inventoryItems</code>, <code>salesRecords</code>, <code>recipes</code>, and <code>settings</code>. For CSV files, select the target entity and use headers that match the dashboard field names.
        </p>
      </div>
    </div>
  );
}
