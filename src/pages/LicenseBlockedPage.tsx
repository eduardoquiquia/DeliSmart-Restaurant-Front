import { useAuth } from '../auth/AuthContext'
import { LockIcon } from '../components/ui/Icons'
import { Logo } from '../components/ui/Logo'
import { cardClass, secondaryButtonClass } from '../components/ui/styles'
import { formatDate } from '../lib/format'

const ESTADOS = { activa: 'Activa', vencida: 'Vencida', cancelada: 'Cancelada', sin_licencia: 'Sin licencia' }

/** El backend bloquea todo el panel (402) cuando la licencia no está activa y vigente. */
export function LicenseBlockedPage() {
  const { profile, logout } = useAuth()
  const licencia = profile?.licencia

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <Logo />
      <div className={`mt-8 w-full max-w-md p-8 text-center ${cardClass}`}>
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-50 text-brand">
          <LockIcon className="size-7" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">Panel bloqueado</h1>
        <p className="mt-2 text-sm text-slate-600">
          {licencia?.motivo || 'La licencia de tu pollería no está activa.'} Mientras tanto, el asistente de WhatsApp
          tampoco atiende pedidos.
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-left text-sm">
          <div>
            <dt className="text-xs text-slate-500">Estado</dt>
            <dd className="font-semibold text-slate-900">{licencia ? ESTADOS[licencia.estado] : '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Vencimiento</dt>
            <dd className="font-semibold text-slate-900">{licencia?.vencimiento ? formatDate(licencia.vencimiento) : '—'}</dd>
          </div>
        </dl>
        <p className="mt-6 text-xs text-slate-500">
          Renueva tu plan desde el panel de DeliSmart (Mi Plan) o escríbenos para reactivarla.
        </p>
        <button type="button" onClick={logout} className={`mt-6 w-full ${secondaryButtonClass}`}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
