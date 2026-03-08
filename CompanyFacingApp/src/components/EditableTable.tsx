import { ReactNode } from 'react';

type Primitive = string | number;

export interface EditableColumn<T extends { id: string }> {
  key: keyof T & string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'datetime-local';
  step?: string;
  options?: Array<{ label: string; value: string }>;
  render?: (row: T) => ReactNode;
}

interface EditableTableProps<T extends { id: string }> {
  rows: T[];
  columns: EditableColumn<T>[];
  onChange: (id: string, key: keyof T & string, value: Primitive) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  addLabel: string;
}

export function EditableTable<T extends { id: string }>({
  rows,
  columns,
  onChange,
  onRemove,
  onAdd,
  addLabel,
}: EditableTableProps<T>) {
  return (
    <div className="table-shell">
      <div className="table-shell__toolbar">
        <button type="button" className="button button--secondary" onClick={onAdd}>
          {addLabel}
        </button>
      </div>
      <div className="table-shell__scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => {
                  if (column.render) {
                    return <td key={column.key}>{column.render(row)}</td>;
                  }

                  const value = row[column.key] as Primitive;

                  return (
                    <td key={column.key}>
                      {column.type === 'select' ? (
                        <select
                          value={String(value ?? '')}
                          onChange={(event) => onChange(row.id, column.key, event.target.value)}
                        >
                          {column.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={column.type ?? 'text'}
                          value={value == null ? '' : String(value)}
                          step={column.step}
                          onChange={(event) => {
                            const nextValue = column.type === 'number' ? Number(event.target.value) : event.target.value;
                            onChange(row.id, column.key, nextValue);
                          }}
                        />
                      )}
                    </td>
                  );
                })}
                <td>
                  <button type="button" className="button button--ghost" onClick={() => onRemove(row.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
