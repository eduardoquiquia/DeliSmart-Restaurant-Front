import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Field, FormError } from '../components/ui/Field'
import { AlertIcon, EditIcon, PlusIcon, SwapIcon, TrashIcon } from '../components/ui/Icons'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { QueryBoundary } from '../components/ui/QueryBoundary'
import { Badge } from '../components/ui/StatusBadge'
import { cardClass, iconButtonClass, inputClass, primaryButtonClass, secondaryButtonClass, selectClass } from '../components/ui/styles'
import { errorMessage } from '../lib/api'
import { formatDateTime, formatMoney } from '../lib/format'
import { useInsumos, useMovimientos, useRegistrarMovimiento, useRemoveInsumo, useSaveInsumo } from '../lib/queries'
import type { Insumo, Movimiento } from '../lib/types'

const UNIDADES = { kg: 'Kilogramos', g: 'Gramos', l: 'Litros', unidad: 'Unidades', paquete: 'Paquetes' }

function InsumoModal({ insumo, onClose }: { insumo: Insumo | null; onClose: () => void }) {
  const save = useSaveInsumo()
  const remove = useRemoveInsumo()
  const [values, setValues] = useState({
    nombre: insumo?.nombre ?? '',
    unidad: insumo?.unidad ?? 'unidad',
    stock: insumo?.stock ?? '0',
    stock_minimo: insumo?.stock_minimo ?? '0',
    costo_unitario: insumo?.costo_unitario ?? '0',
    proveedor: insumo?.proveedor ?? '',
  })
  const set = (patch: Partial<typeof values>) => setValues((current) => ({ ...current, ...patch }))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    save.mutate({ id: insumo?.id, values: values as Partial<Insumo> }, { onSuccess: onClose })
  }

  return (
    <Modal title={insumo ? 'Editar insumo' : 'Nuevo insumo'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" className="sm:col-span-2">
          <input className={inputClass} value={values.nombre} onChange={(e) => set({ nombre: e.target.value })} required />
        </Field>
        <Field label="Unidad">
          <select className={`mt-1.5 ${selectClass}`} value={values.unidad} onChange={(e) => set({ unidad: e.target.value as Insumo['unidad'] })}>
            {Object.entries(UNIDADES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Proveedor">
          <input className={inputClass} value={values.proveedor} onChange={(e) => set({ proveedor: e.target.value })} />
        </Field>
        {!insumo && (
          <Field label="Stock inicial">
            <input className={inputClass} type="number" min="0" step="0.01" value={values.stock} onChange={(e) => set({ stock: e.target.value })} />
          </Field>
        )}
        <Field label="Stock mínimo" hint="Por debajo de este valor se genera una alerta.">
          <input className={inputClass} type="number" min="0" step="0.01" value={values.stock_minimo} onChange={(e) => set({ stock_minimo: e.target.value })} />
        </Field>
        <Field label="Costo unitario (S/)">
          <input className={inputClass} type="number" min="0" step="0.01" value={values.costo_unitario} onChange={(e) => set({ costo_unitario: e.target.value })} />
        </Field>
        <div className="sm:col-span-2">
          <FormError message={save.error ? errorMessage(save.error) : null} />
        </div>
        <div className="flex justify-between gap-3 sm:col-span-2">
          {insumo ? (
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => window.confirm(`¿Eliminar "${insumo.nombre}"?`) && remove.mutate(insumo.id, { onSuccess: onClose })}
            >
              <TrashIcon /> Eliminar
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className={primaryButtonClass} disabled={save.isPending}>
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  )
}

const TIPOS: Record<Movimiento['tipo'], string> = { entrada: 'Entrada (compra)', salida: 'Salida (consumo, merma)', ajuste: 'Ajuste (conteo físico)' }

function MovimientoModal({ insumo, onClose }: { insumo: Insumo; onClose: () => void }) {
  const registrar = useRegistrarMovimiento(insumo.id)
  const movimientos = useMovimientos(insumo.id)
  const [tipo, setTipo] = useState<Movimiento['tipo']>('entrada')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    registrar.mutate({ tipo, cantidad, motivo }, { onSuccess: () => { setCantidad(''); setMotivo('') } })
  }

  return (
    <Modal title={`Movimientos: ${insumo.nombre}`} subtitle={`Stock actual: ${insumo.stock} ${insumo.unidad}`} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_8rem_1fr_auto] sm:items-end">
        <Field label="Tipo">
          <select className={`mt-1.5 ${selectClass}`} value={tipo} onChange={(e) => setTipo(e.target.value as Movimiento['tipo'])}>
            {Object.entries(TIPOS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tipo === 'ajuste' ? 'Stock real' : 'Cantidad'}>
          <input className={inputClass} type="number" min="0" step="0.01" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required />
        </Field>
        <Field label="Motivo">
          <input className={inputClass} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Field>
        <button type="submit" className={primaryButtonClass} disabled={registrar.isPending}>
          Registrar
        </button>
      </form>
      <div className="mt-3">
        <FormError message={registrar.error ? errorMessage(registrar.error) : null} />
      </div>
      <h3 className="mt-6 mb-2 text-[11px] font-semibold tracking-widest text-slate-400 uppercase">Últimos movimientos</h3>
      <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 text-sm">
        {(movimientos.data ?? []).map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <span>
              <span className="font-semibold capitalize text-slate-900">{m.tipo}</span> {m.cantidad}
              {m.motivo && <span className="text-slate-500"> · {m.motivo}</span>}
              <span className="block text-xs text-slate-500">
                {formatDateTime(m.creado_en)} · {m.usuario_nombre}
              </span>
            </span>
            <span className="text-xs text-slate-500">Quedó en {m.stock_resultante}</span>
          </li>
        ))}
        {movimientos.data?.length === 0 && <li className="px-3 py-6 text-center text-slate-500">Sin movimientos.</li>}
      </ul>
    </Modal>
  )
}

export function InventarioPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.rol === 'admin'
  const [soloAlertas, setSoloAlertas] = useState(false)
  const insumos = useInsumos({ alerta: soloAlertas })
  const todos = useInsumos()
  const alertas = (todos.data ?? []).filter((i) => i.bajo_stock)
  const [editing, setEditing] = useState<Insumo | null | undefined>(undefined)
  const [moviendo, setMoviendo] = useState<Insumo | null>(null)

  const columns: Column<Insumo>[] = [
    { header: 'Insumo', cell: (i) => <span className="font-semibold text-slate-900">{i.nombre}</span> },
    {
      header: 'Stock',
      align: 'right',
      cell: (i) => (
        <span className={i.bajo_stock ? 'font-bold text-brand' : 'font-semibold text-slate-900'}>
          {Number(i.stock)} {i.unidad}
        </span>
      ),
    },
    { header: 'Mínimo', align: 'right', cell: (i) => `${Number(i.stock_minimo)} ${i.unidad}` },
    { header: 'Estado', cell: (i) => (i.bajo_stock ? <Badge tone="red">Reponer</Badge> : <Badge tone="green">OK</Badge>) },
    { header: 'Costo unit.', align: 'right', cell: (i) => formatMoney(i.costo_unitario) },
    { header: 'Proveedor', cell: (i) => i.proveedor || '—' },
    {
      header: '',
      align: 'right',
      cell: (i) => (
        <span className="inline-flex gap-1">
          <button type="button" className={iconButtonClass} aria-label={`Movimientos de ${i.nombre}`} title="Entrada / salida" onClick={() => setMoviendo(i)}>
            <SwapIcon className="size-4" />
          </button>
          {isAdmin && (
            <button type="button" className={iconButtonClass} aria-label={`Editar ${i.nombre}`} onClick={() => setEditing(i)}>
              <EditIcon />
            </button>
          )}
        </span>
      ),
    },
  ]

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader eyebrow="Almacén" title="Inventario" subtitle="Insumos, stock y alertas de reposición." />
        <button type="button" className={primaryButtonClass} onClick={() => setEditing(null)}>
          <PlusIcon /> Nuevo insumo
        </button>
      </div>

      {alertas.length > 0 && (
        <div role="alert" className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <AlertIcon />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-heading font-bold text-slate-900">{alertas.length} insumos con stock bajo</p>
            <p className="truncate text-sm text-slate-600">{alertas.map((i) => i.nombre).join(', ')}</p>
          </div>
        </div>
      )}

      <section className={cardClass}>
        <div className="flex items-center gap-3 border-b border-slate-200 p-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" className="size-4 accent-brand" checked={soloAlertas} onChange={(e) => setSoloAlertas(e.target.checked)} />
            Solo alertas
          </label>
        </div>
        <QueryBoundary query={insumos}>
          {(data) => <DataTable columns={columns} rows={data} rowKey={(i) => i.id} emptyMessage="No hay insumos." dimmed={insumos.isPlaceholderData} />}
        </QueryBoundary>
      </section>

      {editing !== undefined && <InsumoModal insumo={editing} onClose={() => setEditing(undefined)} />}
      {moviendo && <MovimientoModal insumo={moviendo} onClose={() => setMoviendo(null)} />}
    </>
  )
}
