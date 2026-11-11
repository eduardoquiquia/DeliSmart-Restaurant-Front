import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { errorMessage } from '../../lib/api'
import { AlertIcon } from './Icons'
import { secondaryButtonClass } from './styles'

type QueryBoundaryProps<T> = {
  query: UseQueryResult<T>
  skeleton?: ReactNode
  children: (data: T) => ReactNode
}

export function QueryBoundary<T>({ query, skeleton, children }: QueryBoundaryProps<T>) {
  if (query.data !== undefined) return children(query.data)
  if (query.isError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <span className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-brand">
          <AlertIcon />
        </span>
        <p className="text-sm font-medium text-slate-900">{errorMessage(query.error)}</p>
        <button type="button" onClick={() => query.refetch()} className={secondaryButtonClass}>
          Reintentar
        </button>
      </div>
    )
  }
  return skeleton ?? <TableSkeleton />
}

export function TableSkeleton() {
  return (
    <div aria-label="Cargando" className="animate-pulse space-y-3 p-6">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="h-9 rounded-lg bg-slate-100" />
      ))}
    </div>
  )
}
