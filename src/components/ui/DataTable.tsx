import type { ReactNode } from 'react';

interface DataTableProps {
  columns: string[];
  rows: ReactNode[][];
  emptyMessage?: string;
}

export function DataTable({ columns, rows, emptyMessage = 'Nenhum registro encontrado.' }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface-50 text-xs font-bold uppercase tracking-wider text-surface-400">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-5 py-4">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {rows.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-center font-medium text-surface-500" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-surface-50/70">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-5 py-4">{cell}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
