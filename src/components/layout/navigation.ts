import {
  BoardIcon,
  BookIcon,
  BoxIcon,
  ChartIcon,
  ChatIcon,
  ClipboardIcon,
  FlaskIcon,
  SettingsIcon,
  TrendUpIcon,
  UserCogIcon,
  UsersIcon,
  WhatsAppIcon,
} from '../ui/Icons'
import type { Role } from '../../lib/types'

export type NavItem = {
  to: string
  label: string
  Icon: typeof ChartIcon
  roles: Role[]
  badge?: 'whatsapp'
}

export const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Operación',
    items: [
      { to: '/dashboard', label: 'Dashboard', Icon: ChartIcon, roles: ['admin'] },
      { to: '/pedidos-whatsapp', label: 'Pedidos WhatsApp', Icon: WhatsAppIcon, roles: ['admin', 'cajero'], badge: 'whatsapp' },
      { to: '/tablero', label: 'Tablero de cocina', Icon: BoardIcon, roles: ['admin', 'cajero', 'cocina'] },
      { to: '/pedidos', label: 'Pedidos', Icon: ClipboardIcon, roles: ['admin', 'cajero'] },
      { to: '/conversaciones', label: 'Conversaciones', Icon: ChatIcon, roles: ['admin', 'cajero'] },
      { to: '/simulador', label: 'Simulador WhatsApp', Icon: FlaskIcon, roles: ['admin', 'cajero'] },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { to: '/carta', label: 'Carta', Icon: BookIcon, roles: ['admin', 'cajero', 'cocina'] },
      { to: '/clientes', label: 'Clientes', Icon: UsersIcon, roles: ['admin', 'cajero'] },
      { to: '/inventario', label: 'Inventario', Icon: BoxIcon, roles: ['admin', 'cocina'] },
      { to: '/reportes', label: 'Reportes', Icon: TrendUpIcon, roles: ['admin', 'cajero'] },
      { to: '/usuarios', label: 'Usuarios', Icon: UserCogIcon, roles: ['admin'] },
      { to: '/configuracion', label: 'Configuración', Icon: SettingsIcon, roles: ['admin', 'cajero', 'cocina'] },
    ],
  },
]

export const ROLE_LABELS: Record<Role, string> = { admin: 'Administrador', cajero: 'Cajero', cocina: 'Cocina' }
