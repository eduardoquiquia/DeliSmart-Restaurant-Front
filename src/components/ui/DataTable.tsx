import type { ReactNode } from 'react'

export type Column<T> = {
  header: string
  cell: (row: T) => ReactNode
  align?: 'right'
}

type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => number
  emptyMessage: string
  dimmed?: boolean
}

export function DataTable<T>({ columns, rows, rowKey, emptyMessage, dimmed }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="px-6 py-12 text-center text-sm text-slate-500">{emptyMessage}</p>
  }

  return (
    <div className={`overflow-x-auto transition-opacity ${dimmed ? 'opacity-60' : ''}`}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
            {columns.map((column) => (
              <th
                key={column.header}
                scope="col"
                className={`px-6 py-3 whitespace-nowrap ${column.align === 'right' ? 'text-right' : ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="transition-colors hover:bg-slate-50">
              {columns.map((column) => (
                <td
                  key={column.header}
                  className={`px-6 py-3.5 whitespace-nowrap text-slate-600 ${column.align === 'right' ? 'text-right' : ''}`}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
