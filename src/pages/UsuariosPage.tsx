import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ROLE_LABELS } from '../components/layout/navigation'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Field, FormError } from '../components/ui/Field'
import { EditIcon, PlusIcon, TrashIcon } from '../components/ui/Icons'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { QueryBoundary } from '../components/ui/QueryBoundary'
import { Badge } from '../components/ui/StatusBadge'
import { cardClass, iconButtonClass, inputClass, primaryButtonClass, secondaryButtonClass, selectClass } from '../components/ui/styles'
import { errorMessage } from '../lib/api'
import { formatDateTime } from '../lib/format'
import { useRemoveUsuario, useSaveUsuario, useUsuarios } from '../lib/queries'
import type { Role, Usuario } from '../lib/types'

const ROLE_TONES = { admin: 'red', cajero: 'blue', cocina: 'violet' } as const

const ROLE_HINTS: Record<Role, string> = {
  admin: 'Todo el panel, usuarios y configuración.',
  cajero: 'Valida pagos, pedidos, clientes y chats.',
  cocina: 'Tablero de pedidos, disponibilidad e inventario.',
}

function UsuarioModal({ usuario, onClose }: { usuario: Usuario | null; onClose: () => void }) {
  const save = useSaveUsuario()
  const [values, setValues] = useState({
    username: usuario?.username ?? '',
    first_name: usuario?.first_name ?? '',
    last_name: usuario?.last_name ?? '',
    email: usuario?.email ?? '',
    telefono: usuario?.telefono ?? '',
    rol: usuario?.rol ?? ('cajero' as Role),
    is_active: usuario?.is_active ?? true,
    password: '',
  })
  const set = (patch: Partial<typeof values>) => setValues((current) => ({ ...current, ...patch }))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const { password, ...rest } = values
    save.mutate({ id: usuario?.id, values: password ? values : rest }, { onSuccess: onClose })
  }

  return (
    <Modal title={usuario ? 'Editar usuario' : 'Nuevo usuario'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">
          <input className={inputClass} value={values.first_name} onChange={(e) => set({ first_name: e.target.value })} />
        </Field>
        <Field label="Apellido">
          <input className={inputClass} value={values.last_name} onChange={(e) => set({ last_name: e.target.value })} />
        </Field>
        <Field label="Usuario">
          <input className={inputClass} value={values.username} onChange={(e) => set({ username: e.target.value })} required autoComplete="off" />
        </Field>
        <Field label="Correo">
          <input className={inputClass} type="email" value={values.email} onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <Field label="Rol" hint={ROLE_HINTS[values.rol]}>
          <select className={`mt-1.5 ${selectClass}`} value={values.rol} onChange={(e) => set({ rol: e.target.value as Role })}>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={usuario ? 'Nueva contraseña' : 'Contraseña'} hint={usuario ? 'Déjala vacía para no cambiarla.' : 'Mínimo 8 caracteres.'}>
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(e) => set({ password: e.target.value })}
            required={!usuario}
            minLength={8}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
          <input type="checkbox" className="size-4 accent-brand" checked={values.is_active} onChange={(e) => set({ is_active: e.target.checked })} />
          Usuario activo
        </label>
        <div className="sm:col-span-2">
          <FormError message={save.error ? errorMessage(save.error) : null} />
        </div>
        <div className="flex justify-end gap-3 sm:col-span-2">
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

export function UsuariosPage() {
  const { profile } = useAuth()
  const usuarios = useUsuarios()
  const remove = useRemoveUsuario()
  const [editing, setEditing] = useState<Usuario | null | undefined>(undefined)

  const columns: Column<Usuario>[] = [
    {
      header: 'Usuario',
      cell: (u) => (
        <>
          <span className="block font-semibold text-slate-900">{`${u.first_name} ${u.last_name}`.trim() || u.username}</span>
          <span className="text-xs text-slate-500">
            @{u.username}
            {u.email ? ` · ${u.email}` : ''}
          </span>
        </>
      ),
    },
    { header: 'Rol', cell: (u) => <Badge tone={ROLE_TONES[u.rol]}>{ROLE_LABELS[u.rol]}</Badge> },
    { header: 'Estado', cell: (u) => (u.is_active ? <Badge tone="green">Activo</Badge> : <Badge tone="gray">Inactivo</Badge>) },
    { header: 'Último acceso', cell: (u) => (u.last_login ? formatDateTime(u.last_login) : 'Nunca') },
    {
      header: '',
      align: 'right',
      cell: (u) => (
        <span className="inline-flex gap-1">
          <button type="button" className={iconButtonClass} aria-label={`Editar ${u.username}`} onClick={() => setEditing(u)}>
            <EditIcon />
          </button>
          <button
            type="button"
            className={iconButtonClass}
            aria-label={`Eliminar ${u.username}`}
            disabled={u.id === profile?.id}
            onClick={() => window.confirm(`¿Eliminar a ${u.username}?`) && remove.mutate(u.id)}
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
        <PageHeader eyebrow="Equipo" title="Usuarios" subtitle="Personal de la pollería y sus permisos." />
        <button type="button" className={primaryButtonClass} onClick={() => setEditing(null)}>
          <PlusIcon /> Nuevo usuario
        </button>
      </div>
      <section className={cardClass}>
        <QueryBoundary query={usuarios}>
          {(data) => <DataTable columns={columns} rows={data.results} rowKey={(u) => u.id} emptyMessage="Sin usuarios." />}
        </QueryBoundary>
      </section>
      {remove.error && <p className="mt-3 text-sm text-brand-dark">{errorMessage(remove.error)}</p>}
      {editing !== undefined && <UsuarioModal usuario={editing} onClose={() => setEditing(undefined)} />}
    </>
  )
}
