import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { PedidoDetalle } from '../components/pedidos/PedidoDetalle'
import { ClockIcon, MapPinIcon, WhatsAppIcon } from '../components/ui/Icons'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { QueryBoundary } from '../components/ui/QueryBoundary'
import { smallButtonClass } from '../components/ui/styles'
import { errorMessage } from '../lib/api'
import { ESTADOS } from '../lib/constants'
import { formatPhone, isOlderThan, minutesAgo } from '../lib/format'
import { useCambiarEstado, usePedido, useTablero } from '../lib/queries'
import type { EstadoPedido, Pedido, Tablero } from '../lib/types'

const COLUMNAS: { estado: keyof Tablero; hint: string; accent: string }[] = [
  { estado: 'pendiente_validacion', hint: 'Esperan validación de pago', accent: 'border-t-amber-400' },
  { estado: 'en_preparacion', hint: 'En la cocina', accent: 'border-t-violet-400' },
  { estado: 'en_camino', hint: 'Con el repartidor', accent: 'border-t-sky-400' },
  { estado: 'entregado', hint: 'Entregados hoy', accent: 'border-t-emerald-400' },
]

const AVANZAR: Partial<Record<EstadoPedido, { estado: EstadoPedido; label: string }>> = {
  en_preparacion: { estado: 'en_camino', label: 'Despachar' },
  en_camino: { estado: 'entregado', label: 'Entregado' },
}

function Tarjeta({ pedido, onOpen }: { pedido: Pedido; onOpen: () => void }) {
  const { profile } = useAuth()
  const cambiar = useCambiarEstado()
  const siguiente = AVANZAR[pedido.estado]
  const puede = siguiente && (profile?.rol !== 'cocina' || siguiente.estado === 'en_camino')
  const atrasado =
    pedido.estado === 'en_preparacion' && pedido.tiempo_estimado_min !== null && isOlderThan(pedido.creado_en, pedido.tiempo_estimado_min)

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="flex items-center justify-between gap-2">
          <p className="font-heading text-lg font-extrabold text-slate-900">#{pedido.numero}</p>
          {pedido.origen === 'whatsapp' && <WhatsAppIcon className="size-4 text-success" />}
        </div>
        <p className="truncate text-xs font-semibold text-slate-600">{pedido.cliente.nombre || formatPhone(pedido.cliente.telefono)}</p>
        <ul className="mt-2 space-y-0.5 text-sm text-slate-800">
          {pedido.items.map((item) => (
            <li key={item.id}>
              <span className="font-bold">{item.cantidad}×</span> {item.nombre}
              {item.notas && <span className="block pl-5 text-xs text-slate-500">{item.notas}</span>}
            </li>
          ))}
        </ul>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500">
          <span className={`inline-flex items-center gap-1 ${atrasado ? 'text-brand' : ''}`}>
            <ClockIcon className="size-3.5" /> {minutesAgo(pedido.creado_en)}
            {pedido.tiempo_estimado_min ? ` · meta ${pedido.tiempo_estimado_min} min` : ''}
          </span>
          {pedido.distancia_km && (
            <span className="inline-flex items-center gap-1">
              <MapPinIcon className="size-3.5" /> {Number(pedido.distancia_km).toFixed(1)} km
            </span>
          )}
        </div>
      </button>
      {puede && (
        <button
          type="button"
          className={`mt-3 w-full ${smallButtonClass}`}
          disabled={cambiar.isPending}
          onClick={() => cambiar.mutate({ id: pedido.id, estado: siguiente.estado })}
        >
          {siguiente.label}
        </button>
      )}
      {cambiar.error && <p className="mt-2 text-xs text-brand-dark">{errorMessage(cambiar.error)}</p>}
    </article>
  )
}

function DetalleModal({ id, onClose }: { id: number; onClose: () => void }) {
  const query = usePedido(id)
  return (
    <Modal title="Detalle del pedido" onClose={onClose} size="xl">
      <QueryBoundary query={query}>{(pedido) => <PedidoDetalle pedido={pedido} />}</QueryBoundary>
    </Modal>
  )
}

export function TableroPage() {
  const tablero = useTablero()
  const [abierto, setAbierto] = useState<number | null>(null)

  return (
    <>
      <PageHeader eyebrow="Cocina y delivery" title="Tablero de pedidos" subtitle="Pedidos activos por estado. Se actualiza solo." />
      <QueryBoundary query={tablero}>
        {(data) => (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNAS.map(({ estado, hint, accent }) => (
              <section key={estado} className={`flex min-h-64 flex-col rounded-2xl border border-t-4 border-slate-200 bg-slate-100/70 ${accent}`}>
                <header className="flex items-center justify-between px-4 pt-3 pb-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{ESTADOS[estado].label}</h2>
                    <p className="text-[11px] text-slate-500">{hint}</p>
                  </div>
                  <span className="flex size-7 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-700 shadow-sm">
                    {data[estado].length}
                  </span>
                </header>
                <div className="flex-1 space-y-3 p-3 pt-1">
                  {data[estado].length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400">Sin pedidos</p>
                  ) : (
                    data[estado].map((pedido) => <Tarjeta key={pedido.id} pedido={pedido} onOpen={() => setAbierto(pedido.id)} />)
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </QueryBoundary>
      {abierto !== null && <DetalleModal id={abierto} onClose={() => setAbierto(null)} />}
    </>
  )
}
