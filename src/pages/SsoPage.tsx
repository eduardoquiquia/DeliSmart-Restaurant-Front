import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AlertIcon } from '../components/ui/Icons'
import { Logo } from '../components/ui/Logo'
import { primaryButtonClass } from '../components/ui/styles'
import { errorMessage } from '../lib/api'

/** Llega desde "Mi Plan" del panel admin con un token de un solo uso en el fragmento de la URL. */
export function SsoPage() {
  const { signInWithSso } = useAuth()
  const navigate = useNavigate()
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token'))
  const [error, setError] = useState<string | null>(token ? null : 'El enlace no trae un acceso válido.')
  const started = useRef(false)

  useEffect(() => {
    // El token sirve una sola vez: no se canjea dos veces aunque el efecto se repita.
    window.history.replaceState(null, '', window.location.pathname)
    if (!token || started.current) return
    started.current = true
    signInWithSso(token)
      .then(() => navigate('/', { replace: true }))
      .catch((err) => setError(errorMessage(err, 'No pudimos abrir tu panel.')))
  }, [navigate, signInWithSso, token])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo />
      {error ? (
        <div role="alert" className="flex max-w-sm flex-col items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-brand">
            <AlertIcon />
          </span>
          <p className="font-heading text-lg font-bold text-slate-900">No pudimos iniciar tu sesión</p>
          <p className="text-sm text-slate-500">{error}</p>
          <Link to="/login" className={primaryButtonClass}>
            Ingresar con usuario y contraseña
          </Link>
        </div>
      ) : (
        <>
          <span className="size-10 animate-spin rounded-full border-4 border-red-100 border-t-brand" aria-hidden />
          <p className="text-sm text-slate-500">Abriendo tu pollería…</p>
        </>
      )}
    </div>
  )
}
