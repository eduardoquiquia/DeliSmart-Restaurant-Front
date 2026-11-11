import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '../ui/Icons'
import { Logo, LogoMark } from '../ui/Logo'
import { NAV_SECTIONS } from './navigation'

type SidebarProps = {
  collapsed: boolean
  mobileOpen: boolean
  pendingWhatsapp: number
  onToggle: () => void
  onCloseMobile: () => void
}

export function Sidebar({ collapsed, mobileOpen, pendingWhatsapp, onToggle, onCloseMobile }: SidebarProps) {
  const { profile } = useAuth()
  const rol = profile?.rol
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => rol && item.roles.includes(rol)),
  })).filter((section) => section.items.length > 0)

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-slate-900/55 lg:hidden" onClick={onCloseMobile} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:sticky lg:top-0 lg:h-svh lg:translate-x-0 lg:transition-[width] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        <div className={`flex h-16 shrink-0 items-center border-b border-slate-200 px-5 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <span className={collapsed ? 'lg:hidden' : ''}>
            <Logo />
          </span>
          {collapsed && <LogoMark className="hidden size-9 lg:block" />}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
            className="ml-auto rounded-lg p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <CloseIcon />
          </button>
        </div>

        {profile?.restaurante && (
          <div className={`mx-3 mt-3 rounded-xl bg-slate-50 px-3 py-2.5 ${collapsed ? 'lg:hidden' : ''}`}>
            <p className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">Pollería</p>
            <p className="truncate text-sm font-bold text-slate-900">{profile.restaurante.nombre}</p>
          </div>
        )}

        <nav aria-label="Principal" className="flex-1 space-y-5 overflow-y-auto p-3">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p
                className={`px-3 pb-1 text-[11px] font-semibold tracking-widest text-slate-400 uppercase ${collapsed ? 'lg:hidden' : ''}`}
              >
                {section.title}
              </p>
              {section.items.map(({ to, label, Icon, badge }) => {
                const count = badge === 'whatsapp' ? pendingWhatsapp : 0
                return (
                  <NavLink
                    key={to}
                    to={to}
                    title={collapsed ? label : undefined}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                        collapsed ? 'lg:justify-center lg:px-0' : ''
                      } ${isActive ? 'bg-red-50 text-brand' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
                    }
                  >
                    <Icon className="size-5 shrink-0" />
                    <span className={`flex-1 ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
                    {count > 0 && (
                      <span
                        className={`flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white ${
                          collapsed ? 'lg:absolute lg:top-1 lg:right-3' : ''
                        }`}
                        aria-label={`${count} pedidos por validar`}
                      >
                        {count}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="hidden border-t border-slate-200 p-3 lg:block">
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Expandir menú' : 'Replegar menú'}
            aria-expanded={!collapsed}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 ${
              collapsed ? 'justify-center px-0' : ''
            }`}
          >
            {collapsed ? <ChevronRightIcon className="size-5" /> : <ChevronLeftIcon className="size-5" />}
            {!collapsed && 'Replegar menú'}
          </button>
        </div>
      </aside>
    </>
  )
}
