import { Link } from 'react-router-dom'
import { BarChart, HorizontalBars, StatCard } from '../components/ui/Charts'
import { AlertIcon, BagIcon, BoardIcon, BoxIcon, TrendUpIcon, WhatsAppIcon } from '../components/ui/Icons'
import { PageHeader } from '../components/ui/PageHeader'
import { QueryBoundary } from '../components/ui/QueryBoundary'
import { EstadoBadge } from '../components/ui/StatusBadge'
import { cardClass } from '../components/ui/styles'
import { formatMoney, formatShortDate, minutesAgo } from '../lib/format'
import { useNuevosPedidos, useResumen } from '../lib/queries'

export function DashboardPage() {
  const resumen = useResumen()
  const nuevos = useNuevosPedidos()

  return (
    <>
      <PageHeader eyebrow="Resumen" title="Dashboard" subtitle="Cómo va tu pollería hoy y en los últimos 7 días." />
      <QueryBoundary query={resumen} skeleton={<div className="h-96 animate-pulse rounded-2xl bg-slate-100" />}>
        {(data) => {
          const whatsapp = data.por_origen.whatsapp
          const totalOrigen = whatsapp + data.por_origen.manual
          return (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Ventas de hoy" value={formatMoney(data.hoy.ventas)} note={`${data.hoy.pedidos} pedidos hoy`} icon={<TrendUpIcon />} tone="success" />
                <StatCard
                  label="Pagos por validar"
                  value={nuevos.data?.total ?? data.hoy.por_validar}
                  note="Pedidos de WhatsApp con comprobante"
                  icon={<WhatsAppIcon />}
                  tone={(nuevos.data?.total ?? 0) > 0 ? 'brand' : 'neutral'}
                />
                <StatCard label="En cocina / en camino" value={`${data.hoy.en_cocina} / ${data.hoy.en_camino}`} note="Pedidos activos ahora" icon={<BoardIcon />} tone="warning" />
                <StatCard
                  label="Insumos en alerta"
                  value={data.insumos_bajo_stock}
                  note="Stock igual o menor al mínimo"
                  icon={<BoxIcon />}
                  tone={data.insumos_bajo_stock > 0 ? 'brand' : 'success'}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <section className={`p-5 lg:col-span-2 ${cardClass}`}>
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <h2 className="font-heading font-bold text-slate-900">Ventas de los últimos 7 días</h2>
                      <p className="text-sm text-slate-500">Pedidos no cancelados</p>
                    </div>
                    <p className="font-heading text-2xl font-extrabold text-slate-900">{formatMoney(data.ventas_total)}</p>
                  </div>
                  <div className="mt-8">
                    <BarChart
                      bars={data.serie_diaria.map((dia) => ({
                        label: formatShortDate(dia.fecha),
                        value: Number(dia.ventas),
                        display: `${formatMoney(dia.ventas)} · ${dia.pedidos} ped.`,
                      }))}
                    />
                  </div>
                </section>

                <section className={`p-5 ${cardClass}`}>
                  <h2 className="font-heading font-bold text-slate-900">Canal de pedidos</h2>
                  <p className="text-sm text-slate-500">Últimos 7 días</p>
                  <div className="mt-5 flex items-center gap-4">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-success">
                      <WhatsAppIcon className="size-6" />
                    </span>
                    <div>
                      <p className="font-heading text-3xl font-extrabold text-slate-900">
                        {totalOrigen ? Math.round((whatsapp / totalOrigen) * 100) : 0}%
                      </p>
                      <p className="text-xs text-slate-500">{whatsapp} pedidos llegaron por WhatsApp</p>
                    </div>
                  </div>
                  <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-success" style={{ width: `${totalOrigen ? (whatsapp / totalOrigen) * 100 : 0}%` }} />
                  </div>
                  <p className="mt-2 flex justify-between text-xs text-slate-500">
                    <span>WhatsApp {whatsapp}</span>
                    <span>Manual {data.por_origen.manual}</span>
                  </p>
                  <dl className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Ticket promedio</dt>
                      <dd className="font-semibold text-slate-900">{formatMoney(data.ticket_promedio)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Cancelados</dt>
                      <dd className="font-semibold text-slate-900">{data.por_estado.cancelado}</dd>
                    </div>
                  </dl>
                </section>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className={`p-5 ${cardClass}`}>
                  <h2 className="font-heading font-bold text-slate-900">Más vendidos</h2>
                  <p className="mb-5 text-sm text-slate-500">Unidades en los últimos 7 días</p>
                  {data.productos_top.length ? (
                    <HorizontalBars
                      rows={data.productos_top.slice(0, 5).map((p) => ({
                        label: p.nombre,
                        value: p.cantidad,
                        display: `${p.cantidad} u · ${formatMoney(p.ingresos)}`,
                      }))}
                    />
                  ) : (
                    <p className="text-sm text-slate-500">Aún no hay ventas.</p>
                  )}
                </section>

                <section className={`p-5 ${cardClass}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-heading font-bold text-slate-900">Por validar ahora</h2>
                      <p className="text-sm text-slate-500">Pedidos de WhatsApp esperando tu confirmación</p>
                    </div>
                    <Link to="/pedidos-whatsapp" className="text-sm font-semibold text-brand hover:text-brand-dark">
                      Ver todos
                    </Link>
                  </div>
                  <ul className="mt-4 divide-y divide-slate-100">
                    {(nuevos.data?.pendientes ?? []).slice(0, 5).map((pedido) => (
                      <li key={pedido.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <span className="min-w-0">
                          <span className="font-semibold text-slate-900">#{pedido.numero}</span>{' '}
                          <span className="text-slate-600">{pedido.cliente.nombre}</span>
                          <span className="block text-xs text-slate-500">{minutesAgo(pedido.creado_en)}</span>
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="font-semibold">{formatMoney(pedido.total)}</span>
                          <EstadoBadge estado={pedido.estado} />
                        </span>
                      </li>
                    ))}
                    {nuevos.data?.pendientes.length === 0 && (
                      <li className="flex items-center gap-2 py-6 text-sm text-slate-500">
                        <BagIcon className="size-4" /> No hay pagos pendientes.
                      </li>
                    )}
                  </ul>
                  {data.insumos_bajo_stock > 0 && (
                    <Link
                      to="/inventario"
                      className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-700"
                    >
                      <AlertIcon className="size-4" /> {data.insumos_bajo_stock} insumos con stock bajo
                    </Link>
                  )}
                </section>
              </div>
            </div>
          )
        }}
      </QueryBoundary>
    </>
  )
}
