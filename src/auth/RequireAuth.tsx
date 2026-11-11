import { useQueryClient } from '@tanstack/react-query'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AlertIcon } from '../components/ui/Icons'
import { primaryButtonClass, secondaryButtonClass } from '../components/ui/styles'
import { LicenseBlockedPage } from '../pages/LicenseBlockedPage'
import { HOME_BY_ROLE } from '../lib/constants'
import type { Role } from '../lib/types'
import { useAuth } from './AuthContext'

function FullScreenLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center" aria-label="Cargando">
      <span className="size-10 animate-spin rounded-full border-4 border-red-100 border-t-brand" />
    </div>
  )
}

function ProfileError() {
  const { logout } = useAuth()
  const queryClient = useQueryClient()
  return (
    <div role="alert" className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-brand">
        <AlertIcon />
      </span>
      <p className="font-heading text-lg font-bold text-slate-900">No pudimos cargar tu sesión</p>
      <p className="text-sm text-slate-500">Revisa que el servidor de la pollería esté activo.</p>
      <div className="flex gap-3">
        <button type="button" className={secondaryButtonClass} onClick={logout}>
          Cerrar sesión
        </button>
        <button type="button" className={primaryButtonClass} onClick={() => queryClient.refetchQueries({ queryKey: ['me'] })}>
          Reintentar
        </button>
      </div>
    </div>
  )
}

export function RequireAuth() {
  const { isAuthenticated, profile, profileError } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (profileError && !profile) return <ProfileError />
  if (!profile) return <FullScreenLoader />
  if (!profile.licencia.vigente) return <LicenseBlockedPage />
  return <Outlet />
}

/** Cada rol solo entra a sus vistas; la API lo exige igual, esto evita pantallas de error. */
export function RequireRole({ roles }: { roles: Role[] }) {
  const { profile } = useAuth()
  if (!profile) return null
  return roles.includes(profile.rol) ? <Outlet /> : <Navigate to={HOME_BY_ROLE[profile.rol]} replace />
}

export function RoleHome() {
  const { profile } = useAuth()
  return profile ? <Navigate to={HOME_BY_ROLE[profile.rol]} replace /> : null
}
