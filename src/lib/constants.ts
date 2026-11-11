import type { EstadoPedido, MetodoPago, Role } from './types'

export type Tone = 'green' | 'red' | 'amber' | 'blue' | 'violet' | 'gray'

export const ESTADOS: Record<EstadoPedido, { label: string; tone: Tone }> = {
  pendiente_validacion: { label: 'Por validar', tone: 'amber' },
  en_preparacion: { label: 'En preparación', tone: 'violet' },
  en_camino: { label: 'En camino', tone: 'blue' },
  entregado: { label: 'Entregado', tone: 'green' },
  cancelado: { label: 'Cancelado', tone: 'gray' },
}

export const METODOS: Record<MetodoPago, string> = { yape: 'Yape', plin: 'Plin', transferencia: 'Transferencia', efectivo: 'Efectivo' }

export const HOME_BY_ROLE: Record<Role, string> = {
  admin: '/dashboard',
  cajero: '/pedidos-whatsapp',
  cocina: '/tablero',
}
