import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PedidoDetalle } from '../components/pedidos/PedidoDetalle'
import { EmptyState } from '../components/ui/Field'
import { ClockIcon, FlaskIcon, ImageIcon, MapPinIcon, WhatsAppIcon } from '../components/ui/Icons'
import { PageHeader } from '../components/ui/PageHeader'
import { QueryBoundary } from '../components/ui/QueryBoundary'
import { EstadoBadge } from '../components/ui/StatusBadge'
import { cardClass, secondaryButtonClass } from '../components/ui/styles'
import { POLLING_MS } from '../lib/api'
import { formatMoney, formatPhone, isoDate, minutesAgo } from '../lib/format'
import { useNuevosPedidos, usePedido, usePedidos } from '../lib/queries'
import type { Pedido } from '../lib/types'

type Tab = 'pendientes' | 'hoy'

function PedidoCard({ pedido, selected, onSelect }: { pedido: Pedido; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        selected ? 'border-brand bg-red-50/60 ring-2 ring-brand/15' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-heading font-extrabold text-slate-900">#{pedido.numero}</p>
          <p className="truncate text-sm font-semibold text-slate-700">{pedido.cliente.nombre || formatPhone(pedido.cliente.telefono)}</p>
        </div>
        <span className="font-heading font-extrabold text-slate-900">{formatMoney(pedido.total)}</span>
      </div>
      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
        {pedido.items.map((item) => `${item.cantidad}× ${item.nombre}`).join(', ')}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
        <EstadoBadge estado={pedido.estado} />
        <span className="inline-flex items-center gap-1 text-slate-500">
          <ClockIcon className="size-3.5" /> {minutesAgo(pedido.creado_en)}
        </span>
        {pedido.distancia_km && (
          <span className="inline-flex items-center gap-1 text-slate-500">
            <MapPinIcon className="size-3.5" /> {Number(pedido.distancia_km).toFixed(1)} km
          </span>
        )}
        {pedido.comprobante && (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <ImageIcon className="size-3.5" /> Comprobante
          </span>
        )}
      </div>
    </button>
  )
}

function Detalle({ id }: { id: number }) {
  const query = usePedido(id)
  return <QueryBoundary query={query}>{(pedido) => <PedidoDetalle pedido={pedido} />}</QueryBoundary>
}

export function PedidosWhatsappPage() {
  const [tab, setTab] = useState<Tab>('pendientes')
  const [selected, setSelected] = useState<number | null>(null)
  const nuevos = useNuevosPedidos()
  const hoy = usePedidos({ origen: 'whatsapp', desde: isoDate(new Date()) })
  const lista = tab === 'pendientes' ? nuevos.data?.pendientes : hoy.data?.results
  const activo = selected ?? lista?.[0]?.id ?? null

  return (
    <>
      <PageHeader
        eyebrow="Caja"
        title="Pedidos por WhatsApp"
        subtitle={`El asistente arma los pedidos; tú validas el comprobante. Se actualiza cada ${POLLING_MS / 1000} s.`}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section className="space-y-3">
          <div className="flex rounded-xl bg-slate-100 p-1 text-sm font-semibold" role="tablist">
            {(
              [
                ['pendientes', `Por validar (${nuevos.data?.total ?? 0})`],
                ['hoy', 'Hoy'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                onClick={() => {
                  setTab(value)
                  setSelected(null)
                }}
                className={`flex-1 rounded-lg px-3 py-2 transition-colors ${tab === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="flex items-center gap-2 text-xs text-slate-500">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            Escuchando pedidos nuevos
          </p>

          {lista === undefined ? (
            <div className="space-y-3">
              {[0, 1, 2].map((key) => (
                <div key={key} className="h-28 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : lista.length === 0 ? (
            <div className={cardClass}>
              <EmptyState
                icon={<WhatsAppIcon />}
                title={tab === 'pendientes' ? 'Sin pagos por validar' : 'Sin pedidos de WhatsApp hoy'}
                text="Cuando un cliente envíe su comprobante, el pedido aparecerá aquí al instante."
                action={
                  <Link to="/simulador" className={secondaryButtonClass}>
                    <FlaskIcon className="size-4" /> Probar con el simulador
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {lista.map((pedido) => (
                <PedidoCard key={pedido.id} pedido={pedido} selected={pedido.id === activo} onSelect={() => setSelected(pedido.id)} />
              ))}
            </div>
          )}
        </section>

        <section className={`p-5 sm:p-6 ${cardClass}`}>
          {activo ? (
            <Detalle id={activo} />
          ) : (
            <EmptyState icon={<WhatsAppIcon />} title="Selecciona un pedido" text="Verás el comprobante, la ubicación y el chat con el cliente." />
          )}
        </section>
      </div>
    </>
  )
}
