import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { EmptyState, Field, FormError } from '../components/ui/Field'
import { BookIcon, EditIcon, ImageIcon, PlusIcon, SearchIcon, TrashIcon } from '../components/ui/Icons'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { QueryBoundary } from '../components/ui/QueryBoundary'
import { cardClass, iconButtonClass, inputClass, primaryButtonClass, secondaryButtonClass, selectClass } from '../components/ui/styles'
import { errorMessage } from '../lib/api'
import { formatMoney, toFormData } from '../lib/format'
import { useCategorias, usePlatos, useRemoveCategoria, useRemovePlato, useSaveCategoria, useSavePlato } from '../lib/queries'
import type { Categoria, Plato } from '../lib/types'

function PlatoModal({ plato, categorias, onClose }: { plato: Plato | null; categorias: Categoria[]; onClose: () => void }) {
  const save = useSavePlato()
  const remove = useRemovePlato()
  const [values, setValues] = useState({
    nombre: plato?.nombre ?? '',
    categoria: String(plato?.categoria ?? categorias[0]?.id ?? ''),
    precio: plato?.precio ?? '',
    descripcion: plato?.descripcion ?? '',
    alias: plato?.alias ?? '',
    disponible: plato?.disponible ?? true,
  })
  const [imagen, setImagen] = useState<File | null>(null)
  const set = (patch: Partial<typeof values>) => setValues((current) => ({ ...current, ...patch }))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    save.mutate({ id: plato?.id, values: toFormData({ ...values, imagen }) }, { onSuccess: onClose })
  }

  return (
    <Modal title={plato ? 'Editar plato' : 'Nuevo plato'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" className="sm:col-span-2">
          <input className={inputClass} value={values.nombre} onChange={(e) => set({ nombre: e.target.value })} required />
        </Field>
        <Field label="Categoría">
          <select className={`mt-1.5 ${selectClass}`} value={values.categoria} onChange={(e) => set({ categoria: e.target.value })} required>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Precio (S/)">
          <input className={inputClass} type="number" min="0.1" step="0.1" value={values.precio} onChange={(e) => set({ precio: e.target.value })} required />
        </Field>
        <Field label="Descripción" className="sm:col-span-2">
          <input className={inputClass} value={values.descripcion} onChange={(e) => set({ descripcion: e.target.value })} />
        </Field>
        <Field label="Alias para WhatsApp" hint="Separados por coma: cómo lo piden los clientes (ej. medio pollo, 1/2)." className="sm:col-span-2">
          <input className={inputClass} value={values.alias} onChange={(e) => set({ alias: e.target.value })} />
        </Field>
        <Field label="Imagen">
          <input
            type="file"
            accept="image/*"
            className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-red-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand"
            onChange={(e) => setImagen(e.target.files?.[0] ?? null)}
          />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={values.disponible} onChange={(e) => set({ disponible: e.target.checked })} className="size-4 accent-brand" />
          Disponible para pedir
        </label>
        <div className="sm:col-span-2">
          <FormError message={save.error || remove.error ? errorMessage(save.error ?? remove.error) : null} />
        </div>
        <div className="flex justify-between gap-3 sm:col-span-2">
          {plato ? (
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => window.confirm(`¿Eliminar "${plato.nombre}"?`) && remove.mutate(plato.id, { onSuccess: onClose })}
            >
              <TrashIcon /> Eliminar
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className={primaryButtonClass} disabled={save.isPending}>
            {save.isPending ? 'Guardando…' : 'Guardar plato'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function CategoriasModal({ categorias, onClose }: { categorias: Categoria[]; onClose: () => void }) {
  const save = useSaveCategoria()
  const remove = useRemoveCategoria()
  const [nombre, setNombre] = useState('')

  return (
    <Modal title="Categorías" subtitle="Ordenan la carta que ve el cliente por WhatsApp." onClose={onClose}>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {categorias.map((categoria) => (
          <li key={categoria.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
            <span>
              <span className="font-semibold text-slate-900">{categoria.nombre}</span>
              <span className="ml-2 text-xs text-slate-500">{categoria.total_platos} platos</span>
            </span>
            <button
              type="button"
              className={iconButtonClass}
              aria-label={`Eliminar ${categoria.nombre}`}
              disabled={categoria.total_platos > 0}
              title={categoria.total_platos > 0 ? 'Mueve o elimina sus platos primero' : 'Eliminar'}
              onClick={() => remove.mutate(categoria.id)}
            >
              <TrashIcon />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          save.mutate({ values: { nombre, orden: categorias.length } }, { onSuccess: () => setNombre('') })
        }}
      >
        <input className={`!mt-0 ${inputClass}`} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nueva categoría" required />
        <button type="submit" className={primaryButtonClass} disabled={save.isPending}>
          Agregar
        </button>
      </form>
      <div className="mt-3">
        <FormError message={save.error ? errorMessage(save.error) : null} />
      </div>
    </Modal>
  )
}

export function CartaPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.rol === 'admin'
  const canToggle = isAdmin || profile?.rol === 'cocina'
  const [categoria, setCategoria] = useState<number | ''>('')
  const [search, setSearch] = useState('')
  const categorias = useCategorias()
  const platos = usePlatos({ categoria, search })
  const toggle = useSavePlato()
  const [editing, setEditing] = useState<Plato | null | undefined>(undefined)
  const [showCategorias, setShowCategorias] = useState(false)

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader eyebrow="Menú" title="Carta" subtitle="Lo que el asistente ofrece por WhatsApp. Solo se venden los platos disponibles." />
        {isAdmin && (
          <div className="flex gap-3">
            <button type="button" className={secondaryButtonClass} onClick={() => setShowCategorias(true)}>
              Categorías
            </button>
            <button type="button" className={primaryButtonClass} onClick={() => setEditing(null)} disabled={!categorias.data?.length}>
              <PlusIcon /> Nuevo plato
            </button>
          </div>
        )}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {[{ id: '' as const, nombre: 'Todas' }, ...(categorias.data ?? [])].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoria(c.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                categoria === c.id ? 'bg-brand text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar plato"
            aria-label="Buscar plato"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>

      <QueryBoundary query={platos}>
        {(data) =>
          data.length === 0 ? (
            <div className={cardClass}>
              <EmptyState icon={<BookIcon />} title="Sin platos" text="Agrega platos a la carta para que el asistente pueda venderlos." />
            </div>
          ) : (
            <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${platos.isPlaceholderData ? 'opacity-60' : ''}`}>
              {data.map((plato) => (
                <article key={plato.id} className={`flex overflow-hidden ${cardClass} ${plato.disponible ? '' : 'opacity-70'}`}>
                  <div className="flex w-28 shrink-0 items-center justify-center bg-slate-50 text-slate-300">
                    {plato.imagen ? <img src={plato.imagen} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="size-8" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{plato.categoria_nombre}</p>
                        <h3 className="font-heading font-bold text-slate-900">{plato.nombre}</h3>
                      </div>
                      {isAdmin && (
                        <button type="button" className={iconButtonClass} aria-label={`Editar ${plato.nombre}`} onClick={() => setEditing(plato)}>
                          <EditIcon />
                        </button>
                      )}
                    </div>
                    {plato.descripcion && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{plato.descripcion}</p>}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <span className="font-heading text-lg font-extrabold text-brand">{formatMoney(plato.precio)}</span>
                      <label className={`flex items-center gap-2 text-xs font-semibold ${plato.disponible ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {plato.disponible ? 'Disponible' : 'Agotado'}
                        <input
                          type="checkbox"
                          role="switch"
                          checked={plato.disponible}
                          disabled={!canToggle || toggle.isPending}
                          aria-label={`Disponibilidad de ${plato.nombre}`}
                          onChange={(e) => toggle.mutate({ id: plato.id, values: { disponible: e.target.checked } })}
                          className="peer sr-only"
                        />
                        <span className="relative h-5 w-9 rounded-full bg-slate-300 transition-colors peer-checked:bg-success after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
                      </label>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        }
      </QueryBoundary>

      {editing !== undefined && categorias.data && (
        <PlatoModal plato={editing} categorias={categorias.data} onClose={() => setEditing(undefined)} />
      )}
      {showCategorias && categorias.data && <CategoriasModal categorias={categorias.data} onClose={() => setShowCategorias(false)} />}
    </>
  )
}
