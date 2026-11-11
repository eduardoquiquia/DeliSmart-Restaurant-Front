import { useEffect, useRef, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useNuevosPedidos } from '../../lib/queries'
import type { Pedido } from '../../lib/types'
import { CloseIcon, WhatsAppIcon } from '../ui/Icons'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

const COLLAPSED_KEY = 'delismart-restaurante-sidebar'

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'collapsed'
  } catch {
    return false
  }
}

/** Avisa cuando el polling trae un pedido de WhatsApp que no estaba en la lista anterior. */
function useNewOrderToast(pending: Pedido[] | undefined) {
  const seen = useRef<Set<number> | null>(null)
  const [toast, setToast] = useState<number | null>(null)

  useEffect(() => {
    if (!pending) return
    const previous = seen.current
    seen.current = new Set(pending.map((pedido) => pedido.id))
    const nuevo = previous && pending.find((pedido) => !previous.has(pedido.id))
    if (nuevo) setToast(nuevo.numero)
  }, [pending])

  useEffect(() => {
    if (toast === null) return
    const timer = window.setTimeout(() => setToast(null), 8000)
    return () => window.clearTimeout(timer)
  }, [toast])

  return [toast, () => setToast(null)] as const
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { profile } = useAuth()
  const canSeeOrders = profile?.rol === 'admin' || profile?.rol === 'cajero'
  const nuevos = useNuevosPedidos(canSeeOrders)
  const pending = nuevos.data?.total ?? 0
  const [toast, closeToast] = useNewOrderToast(nuevos.data?.pendientes)

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? 'collapsed' : 'expanded')
    } catch {
      // La preferencia es opcional: sin almacenamiento solo dura esta visita.
    }
  }

  return (
    <div className="flex min-h-svh">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        pendingWhatsapp={pending}
        onToggle={toggleCollapsed}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMenu={() => setMobileOpen(true)} pendingWhatsapp={pending} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      {toast !== null && (
        <div
          role="status"
          className="fixed right-4 bottom-4 z-50 flex max-w-sm items-start gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-xl"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-success">
            <WhatsAppIcon />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-bold text-slate-900">Nuevo pedido #{toast} por WhatsApp</p>
            <p className="mt-0.5 text-xs text-slate-500">Revisa el comprobante y confirma el pago.</p>
            <Link
              to="/pedidos-whatsapp"
              onClick={closeToast}
              className="mt-2 inline-block text-xs font-semibold text-brand hover:text-brand-dark"
            >
              Ver pedidos por validar
            </Link>
          </div>
          <button
            type="button"
            onClick={closeToast}
            aria-label="Cerrar aviso"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
