import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { errorMessage } from '../../lib/api'
import { METODOS } from '../../lib/constants'
import { formatDateTime, formatMoney, formatPhone, minutesAgo } from '../../lib/format'
import { useCambiarEstado, useConfirmarPago, useMensajes } from '../../lib/queries'
import type { EstadoPedido, PedidoDetalle as Detalle } from '../../lib/types'
import { FormError } from '../ui/Field'
import { CheckIcon, ClockIcon, ImageIcon, MapPinIcon, WhatsAppIcon } from '../ui/Icons'
import { Modal } from '../ui/Modal'
import { EstadoBadge } from '../ui/StatusBadge'
import { inputClass, primaryButtonClass, secondaryButtonClass, successButtonClass } from '../ui/styles'
import { ChatThread } from './ChatThread'

const SIGUIENTE: Partial<Record<EstadoPedido, { estado: EstadoPedido; label: string }>> = {
  en_preparacion: { estado: 'en_camino', label: 'Despachar (en camino)' },
  en_camino: { estado: 'entregado', label: 'Marcar entregado' },
}

function CancelModal({ onClose, onConfirm, pending }: { onClose: () => void; onConfirm: (nota: string) => void; pending: boolean }) {
  const [nota, setNota] = useState('')
  return (
    <Modal title="Cancelar pedido" subtitle="El cliente recibe el motivo por WhatsApp." onClose={onClose}>
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Motivo</span>
        <input className={inputClass} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej.: comprobante no válido" />
      </label>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className={secondaryButtonClass} onClick={onClose}>
          Volver
        </button>
        <button type="button" className={primaryButtonClass} disabled={pending} onClick={() => onConfirm(nota)}>
          Cancelar pedido
        </button>
      </div>
    </Modal>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-900">{children}</dd>
    </div>
  )
}

export function PedidoDetalle({ pedido, showChat = true }: { pedido: Detalle; showChat?: boolean }) {
  const { profile } = useAuth()
  const confirmar = useConfirmarPago()
  const cambiar = useCambiarEstado()
  const mensajes = useMensajes(showChat ? pedido.conversacion : null)
  const [cancelando, setCancelando] = useState(false)
  const [zoom, setZoom] = useState(false)
  const error = confirmar.error ?? cambiar.error
  const puedeCaja = profile?.rol === 'admin' || profile?.rol === 'cajero'
  const siguiente = SIGUIENTE[pedido.estado]
  const cancelable = puedeCaja && (pedido.estado === 'pendiente_validacion' || pedido.estado === 'en_preparacion')
  const necesitaPago = pedido.estado === 'pendiente_validacion'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-2xl font-extrabold text-slate-900">Pedido #{pedido.numero}</h2>
            {pedido.origen === 'whatsapp' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <WhatsAppIcon className="size-3.5" /> WhatsApp
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {formatDateTime(pedido.creado_en)} · {minutesAgo(pedido.creado_en)}
          </p>
        </div>
        <EstadoBadge estado={pedido.estado} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h3 className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">Cliente y entrega</h3>
          <p className="font-semibold text-slate-900">{pedido.cliente.nombre || 'Sin nombre'}</p>
          <p className="text-sm text-slate-600">{formatPhone(pedido.cliente.telefono)}</p>
          {pedido.direccion_entrega && <p className="text-sm text-slate-600">{pedido.direccion_entrega}</p>}
          {pedido.referencia && <p className="text-xs text-slate-500">Ref.: {pedido.referencia}</p>}
          <div className="flex flex-wrap gap-2 text-xs">
            {pedido.distancia_km && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                <MapPinIcon className="size-3.5" /> {Number(pedido.distancia_km).toFixed(1)} km · {pedido.tiempo_traslado_min} min traslado
              </span>
            )}
            {pedido.tiempo_estimado_min && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 font-semibold text-brand">
                <ClockIcon className="size-3.5" /> Entrega estimada: {pedido.tiempo_estimado_min} min
              </span>
            )}
          </div>
          {pedido.latitud && (
            <a
              href={`https://www.google.com/maps?q=${pedido.latitud},${pedido.longitud}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs font-semibold text-brand hover:text-brand-dark"
            >
              Abrir ubicación en Google Maps
            </a>
          )}
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h3 className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">Pago</h3>
          <dl className="space-y-1.5">
            <Row label="Método">{METODOS[pedido.metodo_pago]}</Row>
            <Row label={`Adelanto (${pedido.porcentaje_adelanto}%)`}>{formatMoney(pedido.monto_adelanto)}</Row>
            <Row label="Saldo contra entrega">{formatMoney(pedido.saldo_pendiente)}</Row>
            <Row label="Estado del pago">
              {pedido.pago_confirmado ? (
                <span className="text-emerald-600">Confirmado{pedido.pago_confirmado_por ? ` por ${pedido.pago_confirmado_por}` : ''}</span>
              ) : (
                <span className="text-amber-600">Por validar</span>
              )}
            </Row>
          </dl>
          {pedido.comprobante ? (
            <button
              type="button"
              onClick={() => setZoom(true)}
              className="group relative block w-full overflow-hidden rounded-lg border border-slate-200"
            >
              <img src={pedido.comprobante} alt="Comprobante de pago" className="h-44 w-full bg-slate-50 object-contain" />
              <span className="absolute inset-x-0 bottom-0 bg-slate-900/60 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                Ver comprobante completo
              </span>
            </button>
          ) : (
            <p className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-3 text-xs text-slate-500">
              <ImageIcon className="size-4" /> Sin comprobante adjunto
            </p>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
              <th className="px-4 py-2.5">Plato</th>
              <th className="px-4 py-2.5 text-right">Cant.</th>
              <th className="px-4 py-2.5 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pedido.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2.5 text-slate-800">
                  {item.nombre}
                  {item.notas && <span className="block text-xs text-slate-500">{item.notas}</span>}
                </td>
                <td className="px-4 py-2.5 text-right text-slate-600">{item.cantidad}</td>
                <td className="px-4 py-2.5 text-right text-slate-800">{formatMoney(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-200 text-sm">
            <tr>
              <td colSpan={2} className="px-4 pt-2.5 text-right text-slate-500">Delivery</td>
              <td className="px-4 pt-2.5 text-right">{formatMoney(pedido.costo_delivery)}</td>
            </tr>
            <tr>
              <td colSpan={2} className="px-4 pb-3 text-right font-bold text-slate-900">Total</td>
              <td className="px-4 pb-3 text-right font-heading text-lg font-extrabold text-slate-900">{formatMoney(pedido.total)}</td>
            </tr>
          </tfoot>
        </table>
        {pedido.notas && <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-600">Notas: {pedido.notas}</p>}
      </section>

      <FormError message={error ? errorMessage(error) : null} />

      <div className="flex flex-wrap gap-3">
        {necesitaPago && puedeCaja && (
          <button
            type="button"
            className={`flex-1 ${successButtonClass}`}
            disabled={confirmar.isPending || cambiar.isPending}
            onClick={() =>
              pedido.origen === 'whatsapp'
                ? confirmar.mutate(pedido.id)
                : cambiar.mutate({ id: pedido.id, estado: 'en_preparacion' })
            }
          >
            <CheckIcon />
            {confirmar.isPending ? 'Confirmando…' : pedido.origen === 'whatsapp' ? 'Confirmar pago' : 'Enviar a cocina'}
          </button>
        )}
        {siguiente && (
          <button
            type="button"
            className={`flex-1 ${primaryButtonClass}`}
            disabled={cambiar.isPending}
            onClick={() => cambiar.mutate({ id: pedido.id, estado: siguiente.estado })}
          >
            {siguiente.label}
          </button>
        )}
        {cancelable && (
          <button type="button" className={secondaryButtonClass} onClick={() => setCancelando(true)}>
            Cancelar
          </button>
        )}
      </div>

      {pedido.estado === 'cancelado' && pedido.motivo_cancelacion && (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">Motivo de cancelación: {pedido.motivo_cancelacion}</p>
      )}

      {showChat && pedido.conversacion && (
        <section>
          <h3 className="mb-2 text-[11px] font-semibold tracking-widest text-slate-400 uppercase">Conversación de WhatsApp</h3>
          <ChatThread mensajes={mensajes.data ?? []} className="h-80" />
        </section>
      )}

      <section>
        <h3 className="mb-2 text-[11px] font-semibold tracking-widest text-slate-400 uppercase">Historial</h3>
        <ol className="space-y-2 border-l-2 border-slate-200 pl-4">
          {pedido.historial.map((paso, index) => (
            <li key={index} className="text-sm">
              <EstadoBadge estado={paso.estado} />
              <span className="ml-2 text-xs text-slate-500">
                {formatDateTime(paso.creado_en)} · {paso.usuario_nombre}
                {paso.nota ? ` · ${paso.nota}` : ''}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {cancelando && (
        <CancelModal
          pending={cambiar.isPending}
          onClose={() => setCancelando(false)}
          onConfirm={(nota) =>
            cambiar.mutate({ id: pedido.id, estado: 'cancelado', nota }, { onSuccess: () => setCancelando(false) })
          }
        />
      )}
      {zoom && pedido.comprobante && (
        <Modal title={`Comprobante del pedido #${pedido.numero}`} onClose={() => setZoom(false)} size="lg">
          <img src={pedido.comprobante} alt="Comprobante de pago" className="mx-auto max-h-[70vh] rounded-lg" />
        </Modal>
      )}
    </div>
  )
}
