import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { initials } from '../../lib/format'
import { useHealth } from '../../lib/queries'
import { BellIcon, FlaskIcon, LogoutIcon, MenuIcon } from '../ui/Icons'
import { Badge } from '../ui/StatusBadge'
import { ROLE_LABELS } from './navigation'

function ServerBadge() {
  const health = useHealth()
  if (health.isPending) return <Badge tone="gray">Conectando</Badge>
  if (health.isError) return <Badge tone="red">Sin conexión</Badge>
  return <Badge tone="green">En línea</Badge>
}

export function Header({ onOpenMenu, pendingWhatsapp }: { onOpenMenu: () => void; pendingWhatsapp: number }) {
  const { profile, logout } = useAuth()
  const name = profile?.nombre ?? ''
  const canSeeOrders = profile?.rol === 'admin' || profile?.rol === 'cajero'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Abrir menú"
        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <MenuIcon />
      </button>

      <p className="truncate font-heading text-base font-bold text-slate-900 sm:text-lg">{profile?.restaurante?.nombre}</p>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {profile?.integraciones_simuladas && (
          <span
            title="WhatsApp, OpenAI y Google Maps corren en modo simulado (INTEGRATIONS_MOCK=true)."
            className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 md:inline-flex"
          >
            <FlaskIcon className="size-3.5" />
            Modo simulado
          </span>
        )}
        <span className="hidden sm:inline-flex">
          <ServerBadge />
        </span>
        {canSeeOrders && (
          <Link
            to="/pedidos-whatsapp"
            aria-label={`${pendingWhatsapp} pedidos de WhatsApp por validar`}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <BellIcon />
            {pendingWhatsapp > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white ring-2 ring-white">
                {pendingWhatsapp}
              </span>
            )}
          </Link>
        )}
        <span className="hidden h-8 w-px bg-slate-200 sm:block" />
        <span className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-brand">
            {initials(name)}
          </span>
          <span className="hidden leading-tight md:block">
            <span className="block text-sm font-semibold text-slate-900">{name}</span>
            <span className="block text-xs text-slate-500">{profile ? ROLE_LABELS[profile.rol] : ''}</span>
          </span>
        </span>
        <button
          type="button"
          onClick={logout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <LogoutIcon />
        </button>
      </div>
    </header>
  )
}
