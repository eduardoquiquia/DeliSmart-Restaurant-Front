import type { ReactNode } from 'react'

type Bar = { label: string; value: number; display: string }

/** Barras verticales simples: una serie, etiqueta del valor en el tooltip y en la barra activa. */
export function BarChart({ bars, height = 'h-48' }: { bars: Bar[]; height?: string }) {
  const max = Math.max(1, ...bars.map((bar) => bar.value))
  return (
    <div className="flex items-end gap-1.5 sm:gap-2" role="img" aria-label={bars.map((b) => `${b.label}: ${b.display}`).join(', ')}>
      {bars.map((bar) => (
        <div key={bar.label} className="group flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <div className={`relative flex w-full items-end ${height}`}>
            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
              {bar.display}
            </span>
            <div
              title={`${bar.label}: ${bar.display}`}
              className="w-full rounded-t-md bg-brand/85 transition-colors group-hover:bg-brand"
              style={{ height: `${Math.max(2, (bar.value / max) * 100)}%` }}
            />
          </div>
          <span className="w-full truncate text-center text-[10px] text-slate-500">{bar.label}</span>
        </div>
      ))}
    </div>
  )
}

export function HorizontalBars({ rows }: { rows: { label: string; value: number; display: ReactNode }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-slate-800">{row.label}</span>
            <span className="shrink-0 text-xs text-slate-500">{row.display}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-brand" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

const TONES = {
  neutral: 'bg-slate-100 text-slate-600',
  brand: 'bg-red-50 text-brand',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
}

export function StatCard({
  label,
  value,
  note,
  icon,
  tone = 'neutral',
}: {
  label: string
  value: ReactNode
  note: string
  icon: ReactNode
  tone?: keyof typeof TONES
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>{icon}</span>
      </div>
      <p className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </article>
  )
}
