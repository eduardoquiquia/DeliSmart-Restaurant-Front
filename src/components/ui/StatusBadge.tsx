import type { ReactNode } from 'react'
import { ESTADOS, type Tone } from '../../lib/constants'
import type { EstadoPedido } from '../../lib/types'

const STYLES: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-brand-dark',
  amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-sky-50 text-sky-700',
  violet: 'bg-violet-50 text-violet-700',
  gray: 'bg-slate-100 text-slate-600',
}

const DOTS: Record<Tone, string> = {
  green: 'bg-success',
  red: 'bg-brand',
  amber: 'bg-amber-500',
  blue: 'bg-sky-500',
  violet: 'bg-violet-500',
  gray: 'bg-slate-400',
}

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${STYLES[tone]}`}
    >
      <span className={`size-1.5 rounded-full ${DOTS[tone]}`} />
      {children}
    </span>
  )
}

export function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  const { label, tone } = ESTADOS[estado]
  return <Badge tone={tone}>{label}</Badge>
}
