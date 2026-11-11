export type Role = 'admin' | 'cajero' | 'cocina'

export type Licencia = {
  vigente: boolean
  estado: 'activa' | 'vencida' | 'cancelada' | 'sin_licencia'
  vencimiento: string | null
  fuente: string
  motivo: string
}

export type Profile = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  nombre: string
  rol: Role
  restaurante: { id: number; nombre: string; subdominio: string } | null
  licencia: Licencia
  integraciones_simuladas: boolean
}

export type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] }

export type Categoria = {
  id: number
  nombre: string
  descripcion: string
  orden: number
  activa: boolean
  total_platos: number
}

export type Plato = {
  id: number
  categoria: number
  categoria_nombre: string
  nombre: string
  descripcion: string
  precio: string
  imagen: string | null
  disponible: boolean
  alias: string
}

export type Cliente = {
  id: number
  nombre: string
  telefono: string
  direccion: string
  referencia: string
  latitud: string | null
  longitud: string | null
  notas: string
  creado_en: string
  total_pedidos: number
  total_gastado: string | null
  ultimo_pedido: string | null
}

export type Insumo = {
  id: number
  nombre: string
  unidad: 'kg' | 'g' | 'l' | 'unidad' | 'paquete'
  unidad_nombre: string
  stock: string
  stock_minimo: string
  costo_unitario: string
  proveedor: string
  bajo_stock: boolean
  actualizado_en: string
}

export type Movimiento = {
  id: number
  tipo: 'entrada' | 'salida' | 'ajuste'
  cantidad: string
  stock_resultante: string
  motivo: string
  usuario_nombre: string
  creado_en: string
}

export type Usuario = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  telefono: string
  rol: Role
  is_active: boolean
  last_login: string | null
  date_joined: string
}

export type EstadoPedido = 'pendiente_validacion' | 'en_preparacion' | 'en_camino' | 'entregado' | 'cancelado'
export type MetodoPago = 'yape' | 'plin' | 'transferencia' | 'efectivo'

export type ItemPedido = {
  id: number
  plato: number | null
  nombre: string
  precio_unitario: string
  cantidad: number
  notas: string
  subtotal: string
}

export type Pedido = {
  id: number
  numero: number
  cliente: { id: number; nombre: string; telefono: string; direccion: string }
  origen: 'whatsapp' | 'manual'
  estado: EstadoPedido
  estado_nombre: string
  items: ItemPedido[]
  subtotal: string
  costo_delivery: string
  total: string
  metodo_pago: MetodoPago
  porcentaje_adelanto: number
  monto_adelanto: string
  saldo_pendiente: string
  pago_confirmado: boolean
  comprobante: string | null
  direccion_entrega: string
  distancia_km: string | null
  tiempo_traslado_min: number | null
  tiempo_estimado_min: number | null
  notas: string
  conversacion: number | null
  creado_en: string
  actualizado_en: string
}

export type PedidoDetalle = Pedido & {
  referencia: string
  latitud: string | null
  longitud: string | null
  pago_confirmado_por: string | null
  pago_confirmado_en: string | null
  motivo_cancelacion: string
  historial: { estado: EstadoPedido; nota: string; usuario_nombre: string; creado_en: string }[]
}

export type Tablero = Record<Exclude<EstadoPedido, 'cancelado'>, Pedido[]>

export type NuevosPedidos = { pendientes: Pedido[]; total: number; ultimo_id: number }

export type Mensaje = {
  id: number
  direccion: 'entrante' | 'saliente'
  autor: 'cliente' | 'asistente' | 'personal' | 'sistema'
  tipo: 'texto' | 'imagen' | 'ubicacion' | 'otro'
  texto: string
  imagen: string | null
  latitud: string | null
  longitud: string | null
  estado_envio: string
  creado_en: string
}

export type Borrador = {
  items?: { plato_id: number; nombre: string; precio: string; cantidad: number }[]
  direccion?: string
  latitud?: number
  longitud?: number
  distancia_km?: number | null
  tiempo_traslado_min?: number | null
  fuera_de_cobertura?: boolean
  metodo_pago?: MetodoPago
  porcentaje_adelanto?: number
  comprobante_mensaje_id?: number
}

export type Conversacion = {
  id: number
  telefono: string
  cliente_id: number
  cliente_nombre: string
  estado: 'bot' | 'humano' | 'cerrada'
  simulada: boolean
  no_leidos: number
  ultimo_mensaje_en: string | null
  ultimo_mensaje: { texto: string; direccion: Mensaje['direccion'] } | null
  pedido_activo: { id: number; numero: number; estado: EstadoPedido } | null
  borrador: Borrador
  creado_en: string
}

export type EstadoIntegraciones = {
  modo_global_simulado: boolean
  servicios: Record<'whatsapp' | 'openai' | 'google_maps', { simulado: boolean; claves_faltantes: string[] }>
}

export type Simulacion = {
  conversacion: Conversacion | null
  mensajes: Mensaje[]
  integraciones: EstadoIntegraciones
  pedido_creado?: { id: number; numero: number } | null
}

export type Restaurante = {
  id: number
  nombre: string
  subdominio: string
  ruc: string
  telefono: string
  logo: string | null
  direccion: string
  latitud: string | null
  longitud: string | null
  radio_cobertura_km: string
  tiempo_preparacion_min: number
  costo_delivery: string
  yape_numero: string
  yape_titular: string
  plin_numero: string
  plin_titular: string
  transferencia_banco: string
  transferencia_cuenta: string
  transferencia_cci: string
  transferencia_titular: string
  whatsapp_numero: string
  whatsapp_phone_number_id: string
  mensaje_bienvenida: string
  bot_activo: boolean
  licencia_estado: Licencia['estado']
  licencia_plan: string
  licencia_vencimiento: string | null
  licencia_vigente: boolean
}

export type Resumen = {
  desde: string
  hasta: string
  ventas_total: string
  ventas_cobradas: string
  pedidos_total: number
  ticket_promedio: string
  por_estado: Record<EstadoPedido, number>
  por_origen: Record<'whatsapp' | 'manual', number>
  serie_diaria: { fecha: string; ventas: string; pedidos: number }[]
  productos_top: { nombre: string; cantidad: number; ingresos: string }[]
  hoy: { pedidos: number; ventas: string; por_validar: number; en_cocina: number; en_camino: number }
  insumos_bajo_stock: number
}
