import { useState } from 'react'
import { BarChart, HorizontalBars, StatCard } from '../components/ui/Charts'
import { BagIcon, CardIcon, TrendUpIcon, WhatsAppIcon } from '../components/ui/Icons'
import { PageHeader } from '../components/ui/PageHeader'
import { QueryBoundary } from '../components/ui/QueryBoundary'
import { cardClass } from '../components/ui/styles'
import { formatMoney, formatShortDate, isoDate } from '../lib/format'
import { ESTADOS } from '../lib/constants'
import { useResumen } from '../lib/queries'
import type { EstadoPedido } from '../lib/types'

const RANGOS = [
  { label: '7 días', dias: 7 },
  { label: '14 días', dias: 14 },
  { label: '30 días', dias: 30 },
]

function hace(dias: number) {
  const date = new Date()
  date.setDate(date.getDate() - dias + 1)
  return isoDate(date)
}

export function ReportesPage() {
  const [desde, setDesde] = useState(hace(14))
  const [hasta, setHasta] = useState(isoDate(new Date()))
  const resumen = useResumen(desde, hasta)

  return (
    <>
      <PageHeader eyebrow="Analítica" title="Reportes" subtitle="Ventas, pedidos y productos más vendidos." />

      <div className={`mb-6 flex flex-wrap items-center gap-3 p-4 ${cardClass}`}>
        <div className="flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          {RANGOS.map(({ label, dias }) => (
            <button
              key={dias}
              type="button"
              onClick={() => {
                setDesde(hace(dias))
                setHasta(isoDate(new Date()))
              }}
              className={`rounded-lg px-3 py-1.5 ${desde === hace(dias) && hasta === isoDate(new Date()) ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Desde
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-1.5" />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Hasta
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-1.5" />
        </label>
      </div>

      <QueryBoundary query={resumen} skeleton={<div className="h-96 animate-pulse rounded-2xl bg-slate-100" />}>
        {(data) => (
          <div className={`space-y-6 transition-opacity ${resumen.isPlaceholderData ? 'opacity-60' : ''}`}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Ventas" value={formatMoney(data.ventas_total)} note="Pedidos no cancelados" icon={<TrendUpIcon />} tone="success" />
              <StatCard label="Cobrado (entregados)" value={formatMoney(data.ventas_cobradas)} note="Pedidos entregados" icon={<CardIcon />} />
              <StatCard label="Pedidos" value={data.pedidos_total} note={`Ticket promedio ${formatMoney(data.ticket_promedio)}`} icon={<BagIcon />} tone="warning" />
              <StatCard label="Por WhatsApp" value={data.por_origen.whatsapp} note={`${data.por_origen.manual} manuales`} icon={<WhatsAppIcon />} tone="brand" />
            </div>

            <section className={`p-5 ${cardClass}`}>
              <h2 className="font-heading font-bold text-slate-900">Ventas por día</h2>
              <p className="text-sm text-slate-500">
                {formatShortDate(data.desde)} – {formatShortDate(data.hasta)}
              </p>
              <div className="mt-8 overflow-x-auto">
                <div style={{ minWidth: `${data.serie_diaria.length * 2.25}rem` }}>
                  <BarChart
                    height="h-56"
                    bars={data.serie_diaria.map((dia) => ({
                      label: formatShortDate(dia.fecha),
                      value: Number(dia.ventas),
                      display: `${formatMoney(dia.ventas)} · ${dia.pedidos} ped.`,
                    }))}
                  />
                </div>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className={`p-5 ${cardClass}`}>
                <h2 className="mb-5 font-heading font-bold text-slate-900">Productos más vendidos</h2>
                {data.productos_top.length ? (
                  <HorizontalBars
                    rows={data.productos_top.map((p) => ({
                      label: p.nombre,
                      value: p.cantidad,
                      display: `${p.cantidad} u · ${formatMoney(p.ingresos)}`,
                    }))}
                  />
                ) : (
                  <p className="text-sm text-slate-500">Sin ventas en este rango.</p>
                )}
              </section>
              <section className={`p-5 ${cardClass}`}>
                <h2 className="mb-5 font-heading font-bold text-slate-900">Pedidos por estado</h2>
                <HorizontalBars
                  rows={(Object.keys(ESTADOS) as EstadoPedido[]).map((estado) => ({
                    label: ESTADOS[estado].label,
                    value: data.por_estado[estado],
                    display: data.por_estado[estado],
                  }))}
                />
              </section>
            </div>
          </div>
        )}
      </QueryBoundary>
    </>
  )
}
