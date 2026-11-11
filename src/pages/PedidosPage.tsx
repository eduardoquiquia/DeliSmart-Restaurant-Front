import { useState, type FormEvent } from 'react'
import { PedidoDetalle } from '../components/pedidos/PedidoDetalle'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Field, FormError } from '../components/ui/Field'
import { EyeIcon, PlusIcon, SearchIcon, TrashIcon, WhatsAppIcon } from '../components/ui/Icons'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { QueryBoundary } from '../components/ui/QueryBoundary'
import { EstadoBadge } from '../components/ui/StatusBadge'
import { cardClass, iconButtonClass, inputClass, primaryButtonClass, secondaryButtonClass, selectClass } from '../components/ui/styles'
import { errorMessage } from '../lib/api'
import { ESTADOS } from '../lib/constants'
import { formatDateTime, formatMoney, formatPhone } from '../lib/format'
import { useCrearPedido, usePedido, usePedidos, usePlatos, type PedidoFilters } from '../lib/queries'
import type { EstadoPedido, Pedido } from '../lib/types'

function NuevoPedidoModal({ onClose }: { onClose: () => void }) {
  const platos = usePlatos()
  const crear = useCrearPedido()
  const [telefono, setTelefono] = useState('')
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [notas, setNotas] = useState('')
  const [metodo, setMetodo] = useState('efectivo')
  const [items, setItems] = useState<{ plato: number; cantidad: number }[]>([])
  const [platoId, setPlatoId] = useState('')
  const disponibles = (platos.data ?? []).filter((plato) => plato.disponible)
  const total = items.reduce((sum, item) => {
    const plato = disponibles.find((p) => p.id === item.plato)
    return sum + Number(plato?.precio ?? 0) * item.cantidad
  }, 0)

  function agregar() {
    const id = Number(platoId)
    if (!id) return
    setItems((current) => {
      const existente = current.find((item) => item.plato === id)
      return existente
        ? current.map((item) => (item.plato === id ? { ...item, cantidad: item.cantidad + 1 } : item))
        : [...current, { plato: id, cantidad: 1 }]
    })
    setPlatoId('')
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    crear.mutate(
      {
        cliente_telefono: telefono,
        cliente_nombre: nombre,
        items,
        metodo_pago: metodo,
        porcentaje_adelanto: 0,
        direccion_entrega: direccion,
        referencia: '',
        notas,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal title="Nuevo pedido manual" subtitle="Para pedidos por teléfono o en mostrador." onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Teléfono del cliente">
            <input className={inputClass} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="987 654 321" required />
          </Field>
          <Field label="Nombre">
            <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </Field>
          <Field label="Dirección de entrega" className="sm:col-span-2">
            <input className={inputClass} value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </Field>
        </div>

        <div>
          <span className="text-sm font-semibold text-slate-700">Platos</span>
          <div className="mt-1.5 flex gap-2">
            <select className={selectClass} value={platoId} onChange={(e) => setPlatoId(e.target.value)} aria-label="Plato">
              <option value="">Elige un plato…</option>
              {disponibles.map((plato) => (
                <option key={plato.id} value={plato.id}>
                  {plato.nombre} — {formatMoney(plato.precio)}
                </option>
              ))}
            </select>
            <button type="button" className={secondaryButtonClass} onClick={agregar} disabled={!platoId}>
              Agregar
            </button>
          </div>
          {items.length > 0 && (
            <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
              {items.map((item) => {
                const plato = disponibles.find((p) => p.id === item.plato)
                return (
                  <li key={item.plato} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className="flex-1 text-slate-800">{plato?.nombre}</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={item.cantidad}
                      aria-label={`Cantidad de ${plato?.nombre}`}
                      onChange={(e) =>
                        setItems((current) =>
                          current.map((i) => (i.plato === item.plato ? { ...i, cantidad: Math.max(1, Number(e.target.value)) } : i)),
                        )
                      }
                      className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-right"
                    />
                    <button
                      type="button"
                      className={iconButtonClass}
                      aria-label={`Quitar ${plato?.nombre}`}
                      onClick={() => setItems((current) => current.filter((i) => i.plato !== item.plato))}
                    >
                      <TrashIcon />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Método de pago">
            <select className={`mt-1.5 ${selectClass}`} value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              <option value="efectivo">Efectivo contra entrega</option>
              <option value="yape">Yape</option>
              <option value="plin">Plin</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </Field>
          <Field label="Notas">
            <input className={inputClass} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Sin ensalada, extra cremas…" />
          </Field>
        </div>

        <FormError message={crear.error ? errorMessage(crear.error) : null} />
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">
            Subtotal <span className="font-heading text-lg font-extrabold text-slate-900">{formatMoney(total)}</span>
          </p>
          <button type="submit" className={primaryButtonClass} disabled={crear.isPending || items.length === 0}>
            {crear.isPending ? 'Registrando…' : 'Registrar pedido'}
          </button>
        </div>
      </form>
    </Modal>
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

export function PedidosPage() {
  const [filters, setFilters] = useState<PedidoFilters>({ page: 1 })
  const [search, setSearch] = useState('')
  const [abierto, setAbierto] = useState<number | null>(null)
  const [nuevo, setNuevo] = useState(false)
  const pedidos = usePedidos(filters)

  function update(patch: PedidoFilters) {
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }))
  }

  const columns: Column<Pedido>[] = [
    {
      header: 'Pedido',
      cell: (p) => (
        <span className="flex items-center gap-2 font-heading font-extrabold text-slate-900">
          #{p.numero}
          {p.origen === 'whatsapp' && <WhatsAppIcon className="size-4 text-success" />}
        </span>
      ),
    },
    {
      header: 'Cliente',
      cell: (p) => (
        <>
          <span className="block font-semibold text-slate-900">{p.cliente.nombre || '—'}</span>
          <span className="text-xs text-slate-500">{formatPhone(p.cliente.telefono)}</span>
        </>
      ),
    },
    { header: 'Fecha', cell: (p) => formatDateTime(p.creado_en) },
    { header: 'Estado', cell: (p) => <EstadoBadge estado={p.estado} /> },
    { header: 'Total', align: 'right', cell: (p) => <span className="font-semibold text-slate-900">{formatMoney(p.total)}</span> },
    {
      header: '',
      align: 'right',
      cell: (p) => (
        <button type="button" className={iconButtonClass} aria-label={`Ver pedido ${p.numero}`} onClick={() => setAbierto(p.id)}>
          <EyeIcon />
        </button>
      ),
    },
  ]

  const totalPages = pedidos.data ? Math.max(1, Math.ceil(pedidos.data.count / 20)) : 1

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader eyebrow="Historial" title="Pedidos" subtitle="Todos los pedidos de WhatsApp y manuales." />
        <button type="button" className={primaryButtonClass} onClick={() => setNuevo(true)}>
          <PlusIcon /> Nuevo pedido
        </button>
      </div>

      <section className={cardClass}>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <form
            role="search"
            className="relative min-w-48 flex-1"
            onSubmit={(event) => {
              event.preventDefault()
              update({ search })
            }}
          >
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onBlur={() => update({ search })}
              placeholder="N.º de pedido, cliente o teléfono"
              aria-label="Buscar pedidos"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-sm outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
            />
          </form>
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            aria-label="Estado"
            value={filters.estado ?? ''}
            onChange={(e) => update({ estado: e.target.value as EstadoPedido | '' })}
          >
            <option value="">Todos los estados</option>
            {Object.entries(ESTADOS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            aria-label="Origen"
            value={filters.origen ?? ''}
            onChange={(e) => update({ origen: e.target.value as PedidoFilters['origen'] })}
          >
            <option value="">WhatsApp y manual</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="manual">Manual</option>
          </select>
          <input
            type="date"
            aria-label="Desde"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            value={filters.desde ?? ''}
            onChange={(e) => update({ desde: e.target.value })}
          />
          <input
            type="date"
            aria-label="Hasta"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            value={filters.hasta ?? ''}
            onChange={(e) => update({ hasta: e.target.value })}
          />
        </div>
        <QueryBoundary query={pedidos}>
          {(data) => (
            <>
              <DataTable columns={columns} rows={data.results} rowKey={(p) => p.id} emptyMessage="No hay pedidos con esos filtros." dimmed={pedidos.isPlaceholderData} />
              <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 text-sm text-slate-500">
                <span>{data.count} pedidos</span>
                <div className="flex items-center gap-2">
                  <button type="button" className={secondaryButtonClass + ' !px-3 !py-1.5'} disabled={!data.previous} onClick={() => update({ page: (filters.page ?? 1) - 1 })}>
                    Anterior
                  </button>
                  <span>
                    {filters.page ?? 1} / {totalPages}
                  </span>
                  <button type="button" className={secondaryButtonClass + ' !px-3 !py-1.5'} disabled={!data.next} onClick={() => update({ page: (filters.page ?? 1) + 1 })}>
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          )}
        </QueryBoundary>
      </section>

      {abierto !== null && <DetalleModal id={abierto} onClose={() => setAbierto(null)} />}
      {nuevo && <NuevoPedidoModal onClose={() => setNuevo(false)} />}
    </>
  )
}
