import { useState, type FormEvent } from 'react'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Field, FormError } from '../components/ui/Field'
import { EditIcon, PlusIcon, SearchIcon, TrashIcon } from '../components/ui/Icons'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { QueryBoundary } from '../components/ui/QueryBoundary'
import { cardClass, iconButtonClass, inputClass, primaryButtonClass, secondaryButtonClass } from '../components/ui/styles'
import { errorMessage } from '../lib/api'
import { formatDate, formatMoney, formatPhone } from '../lib/format'
import { useClientes, useRemoveCliente, useSaveCliente } from '../lib/queries'
import type { Cliente } from '../lib/types'

function ClienteModal({ cliente, onClose }: { cliente: Cliente | null; onClose: () => void }) {
  const save = useSaveCliente()
  const [values, setValues] = useState({
    nombre: cliente?.nombre ?? '',
    telefono: cliente?.telefono ?? '',
    direccion: cliente?.direccion ?? '',
    referencia: cliente?.referencia ?? '',
    notas: cliente?.notas ?? '',
  })
  const set = (patch: Partial<typeof values>) => setValues((current) => ({ ...current, ...patch }))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    save.mutate({ id: cliente?.id, values }, { onSuccess: onClose })
  }

  return (
    <Modal title={cliente ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nombre">
          <input className={inputClass} value={values.nombre} onChange={(e) => set({ nombre: e.target.value })} />
        </Field>
        <Field label="Teléfono (WhatsApp)">
          <input className={inputClass} value={values.telefono} onChange={(e) => set({ telefono: e.target.value })} required />
        </Field>
        <Field label="Dirección">
          <input className={inputClass} value={values.direccion} onChange={(e) => set({ direccion: e.target.value })} />
        </Field>
        <Field label="Referencia">
          <input className={inputClass} value={values.referencia} onChange={(e) => set({ referencia: e.target.value })} />
        </Field>
        <Field label="Notas">
          <textarea className={inputClass} rows={2} value={values.notas} onChange={(e) => set({ notas: e.target.value })} />
        </Field>
        <FormError message={save.error ? errorMessage(save.error) : null} />
        <div className="flex justify-end gap-3">
          <button type="button" className={secondaryButtonClass} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className={primaryButtonClass} disabled={save.isPending}>
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function ClientesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [ordering, setOrdering] = useState('-creado_en')
  const clientes = useClientes({ search, page, ordering })
  const remove = useRemoveCliente()
  const [editing, setEditing] = useState<Cliente | null | undefined>(undefined)

  const columns: Column<Cliente>[] = [
    {
      header: 'Cliente',
      cell: (c) => (
        <>
          <span className="block font-semibold text-slate-900">{c.nombre || 'Sin nombre'}</span>
          <span className="text-xs text-slate-500">{formatPhone(c.telefono)}</span>
        </>
      ),
    },
    { header: 'Dirección', cell: (c) => <span className="block max-w-64 truncate">{c.direccion || '—'}</span> },
    { header: 'Pedidos', align: 'right', cell: (c) => c.total_pedidos },
    { header: 'Gastado', align: 'right', cell: (c) => formatMoney(c.total_gastado ?? 0) },
    { header: 'Último pedido', cell: (c) => (c.ultimo_pedido ? formatDate(c.ultimo_pedido) : '—') },
    {
      header: '',
      align: 'right',
      cell: (c) => (
        <span className="inline-flex gap-1">
          <button type="button" className={iconButtonClass} aria-label={`Editar ${c.nombre}`} onClick={() => setEditing(c)}>
            <EditIcon />
          </button>
          <button
            type="button"
            className={iconButtonClass}
            aria-label={`Eliminar ${c.nombre}`}
            disabled={c.total_pedidos > 0}
            title={c.total_pedidos > 0 ? 'Tiene pedidos registrados' : 'Eliminar'}
            onClick={() => window.confirm(`¿Eliminar a ${c.nombre || c.telefono}?`) && remove.mutate(c.id)}
          >
            <TrashIcon />
          </button>
        </span>
      ),
    },
  ]

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader eyebrow="CRM" title="Clientes" subtitle="Se registran solos al escribir por WhatsApp." />
        <button type="button" className={primaryButtonClass} onClick={() => setEditing(null)}>
          <PlusIcon /> Nuevo cliente
        </button>
      </div>
      <section className={cardClass}>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <div className="relative min-w-48 flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Nombre, teléfono o dirección"
              aria-label="Buscar clientes"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-sm outline-none focus:border-brand focus:bg-white"
            />
          </div>
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            aria-label="Ordenar"
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
          >
            <option value="-creado_en">Más recientes</option>
            <option value="-total_pedidos">Más pedidos</option>
            <option value="-total_gastado">Mayor gasto</option>
            <option value="nombre">Nombre</option>
          </select>
        </div>
        <QueryBoundary query={clientes}>
          {(data) => (
            <>
              <DataTable columns={columns} rows={data.results} rowKey={(c) => c.id} emptyMessage="No hay clientes." dimmed={clientes.isPlaceholderData} />
              <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 text-sm text-slate-500">
                <span>{data.count} clientes</span>
                <div className="flex gap-2">
                  <button type="button" className={`${secondaryButtonClass} !px-3 !py-1.5`} disabled={!data.previous} onClick={() => setPage(page - 1)}>
                    Anterior
                  </button>
                  <button type="button" className={`${secondaryButtonClass} !px-3 !py-1.5`} disabled={!data.next} onClick={() => setPage(page + 1)}>
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          )}
        </QueryBoundary>
      </section>
      {editing !== undefined && <ClienteModal cliente={editing} onClose={() => setEditing(undefined)} />}
    </>
  )
}
