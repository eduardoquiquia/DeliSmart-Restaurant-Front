import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, POLLING_MS } from './api'
import type {
  Categoria,
  Cliente,
  Conversacion,
  EstadoIntegraciones,
  EstadoPedido,
  Insumo,
  Mensaje,
  Movimiento,
  NuevosPedidos,
  Page,
  Pedido,
  PedidoDetalle,
  Plato,
  Profile,
  Restaurante,
  Resumen,
  Simulacion,
  Tablero,
  Usuario,
} from './types'

const get = <T,>(url: string, params?: object) => api.get<T>(url, { params }).then((response) => response.data)

// --- Sesión y restaurante ---------------------------------------------------------------------

export function useProfile(enabled: boolean) {
  return useQuery({ queryKey: ['me'], queryFn: () => get<Profile>('/auth/me/'), enabled, staleTime: 60_000 })
}

export function useRestaurante() {
  return useQuery({ queryKey: ['restaurante'], queryFn: () => get<Restaurante>('/restaurante/') })
}

export function useUpdateRestaurante() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Partial<Restaurante>) => api.patch<Restaurante>('/restaurante/', values).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['restaurante'], data)
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export function useIntegraciones() {
  return useQuery({ queryKey: ['integraciones'], queryFn: () => get<EstadoIntegraciones>('/integraciones/') })
}

export function useHealth() {
  return useQuery({ queryKey: ['health'], queryFn: () => get<{ status: string }>('/health/'), refetchInterval: 60_000 })
}

// --- CRUD genérico ----------------------------------------------------------------------------

function useSave<T extends { id: number }>(resource: string, keys: string[][]) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id?: number; values: Partial<T> | FormData }) =>
      (id ? api.patch<T>(`/${resource}/${id}/`, values) : api.post<T>(`/${resource}/`, values)).then((r) => r.data),
    onSuccess: () => keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey })),
  })
}

function useRemove(resource: string, keys: string[][]) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/${resource}/${id}/`),
    onSuccess: () => keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey })),
  })
}

// --- Carta ------------------------------------------------------------------------------------

export function useCategorias() {
  return useQuery({ queryKey: ['categorias'], queryFn: () => get<Categoria[]>('/categorias/') })
}

export function usePlatos(params: { search?: string; categoria?: number | '' } = {}) {
  return useQuery({
    queryKey: ['platos', params],
    queryFn: () => get<Plato[]>('/platos/', { search: params.search || undefined, categoria: params.categoria || undefined }),
    placeholderData: keepPreviousData,
  })
}

export const useSaveCategoria = () => useSave<Categoria>('categorias', [['categorias'], ['platos']])
export const useRemoveCategoria = () => useRemove('categorias', [['categorias']])
export const useSavePlato = () => useSave<Plato>('platos', [['platos'], ['categorias']])
export const useRemovePlato = () => useRemove('platos', [['platos'], ['categorias']])

// --- Clientes ---------------------------------------------------------------------------------

export function useClientes(params: { search?: string; page?: number; ordering?: string }) {
  return useQuery({
    queryKey: ['clientes', params],
    queryFn: () => get<Page<Cliente>>('/clientes/', { ...params, search: params.search || undefined }),
    placeholderData: keepPreviousData,
  })
}

export const useSaveCliente = () => useSave<Cliente>('clientes', [['clientes']])
export const useRemoveCliente = () => useRemove('clientes', [['clientes']])

// --- Inventario -------------------------------------------------------------------------------

export function useInsumos(params: { search?: string; alerta?: boolean } = {}) {
  return useQuery({
    queryKey: ['insumos', params],
    queryFn: () => get<Insumo[]>('/insumos/', { search: params.search || undefined, alerta: params.alerta || undefined }),
    placeholderData: keepPreviousData,
  })
}

export const useSaveInsumo = () => useSave<Insumo>('insumos', [['insumos'], ['resumen']])
export const useRemoveInsumo = () => useRemove('insumos', [['insumos']])

export function useMovimientos(id: number) {
  return useQuery({ queryKey: ['movimientos', id], queryFn: () => get<Movimiento[]>(`/insumos/${id}/movimientos/`) })
}

export function useRegistrarMovimiento(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: { tipo: Movimiento['tipo']; cantidad: string; motivo: string }) =>
      api.post(`/insumos/${id}/movimientos/`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      queryClient.invalidateQueries({ queryKey: ['movimientos', id] })
    },
  })
}

// --- Usuarios ---------------------------------------------------------------------------------

export function useUsuarios() {
  return useQuery({ queryKey: ['usuarios'], queryFn: () => get<Page<Usuario>>('/usuarios/', { page_size: 100 }) })
}

export const useSaveUsuario = () => useSave<Usuario & { password?: string }>('usuarios', [['usuarios']])
export const useRemoveUsuario = () => useRemove('usuarios', [['usuarios']])

// --- Pedidos ----------------------------------------------------------------------------------

export type PedidoFilters = {
  search?: string
  estado?: EstadoPedido | ''
  origen?: 'whatsapp' | 'manual' | ''
  desde?: string
  hasta?: string
  page?: number
}

export function usePedidos(filters: PedidoFilters) {
  return useQuery({
    queryKey: ['pedidos', 'lista', filters],
    queryFn: () =>
      get<Page<Pedido>>(
        '/pedidos/',
        Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined)),
      ),
    placeholderData: keepPreviousData,
  })
}

export function usePedido(id: number | null) {
  return useQuery({
    queryKey: ['pedidos', 'detalle', id],
    queryFn: () => get<PedidoDetalle>(`/pedidos/${id}/`),
    enabled: id !== null,
    refetchInterval: POLLING_MS,
  })
}

/** Polling (sin WebSockets) de los pedidos de WhatsApp que esperan validación de pago. */
export function useNuevosPedidos(enabled = true) {
  return useQuery({
    queryKey: ['pedidos', 'nuevos'],
    queryFn: () => get<NuevosPedidos>('/pedidos/nuevos/'),
    refetchInterval: POLLING_MS,
    refetchIntervalInBackground: true,
    enabled,
  })
}

export function useTablero() {
  return useQuery({ queryKey: ['pedidos', 'tablero'], queryFn: () => get<Tablero>('/pedidos/tablero/'), refetchInterval: POLLING_MS })
}

function useInvalidatePedidos() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    queryClient.invalidateQueries({ queryKey: ['resumen'] })
    queryClient.invalidateQueries({ queryKey: ['conversaciones'] })
  }
}

export function useConfirmarPago() {
  const invalidate = useInvalidatePedidos()
  return useMutation({
    mutationFn: (id: number) => api.post<PedidoDetalle>(`/pedidos/${id}/confirmar-pago/`).then((r) => r.data),
    onSuccess: invalidate,
  })
}

export function useCambiarEstado() {
  const invalidate = useInvalidatePedidos()
  return useMutation({
    mutationFn: ({ id, estado, nota = '' }: { id: number; estado: EstadoPedido; nota?: string }) =>
      api.post<PedidoDetalle>(`/pedidos/${id}/estado/`, { estado, nota }).then((r) => r.data),
    onSuccess: invalidate,
  })
}

export type PedidoManual = {
  cliente_telefono: string
  cliente_nombre: string
  items: { plato: number; cantidad: number; notas?: string }[]
  metodo_pago: string
  porcentaje_adelanto: number
  direccion_entrega: string
  referencia: string
  notas: string
}

export function useCrearPedido() {
  const invalidate = useInvalidatePedidos()
  return useMutation({
    mutationFn: (values: PedidoManual) => api.post<PedidoDetalle>('/pedidos/', values).then((r) => r.data),
    onSuccess: invalidate,
  })
}

// --- Conversaciones y simulador --------------------------------------------------------------

export function useConversaciones(search: string) {
  return useQuery({
    queryKey: ['conversaciones', search],
    queryFn: () => get<Page<Conversacion>>('/conversaciones/', { search: search || undefined, page_size: 100 }),
    refetchInterval: POLLING_MS,
    placeholderData: keepPreviousData,
  })
}

export function useMensajes(conversacionId: number | null) {
  return useQuery({
    queryKey: ['conversaciones', 'mensajes', conversacionId],
    queryFn: () => get<Mensaje[]>(`/conversaciones/${conversacionId}/mensajes/`),
    enabled: conversacionId !== null,
    refetchInterval: POLLING_MS,
  })
}

export function useResponderConversacion(conversacionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (texto: string) => api.post(`/conversaciones/${conversacionId}/responder/`, { texto }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversaciones'] }),
  })
}

export function useEstadoConversacion(conversacionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (estado: Conversacion['estado']) => api.post(`/conversaciones/${conversacionId}/estado/`, { estado }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversaciones'] }),
  })
}

export function useSimulacion(telefono: string) {
  return useQuery({ queryKey: ['simulador', telefono], queryFn: () => get<Simulacion>('/simulador/', { telefono }) })
}

export function useEnviarSimulacion(telefono: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (form: FormData) => api.post<Simulacion>('/simulador/', form).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['simulador', telefono], data)
      if (data.pedido_creado) queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      queryClient.invalidateQueries({ queryKey: ['conversaciones'] })
    },
  })
}

export function useReiniciarSimulacion(telefono: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete('/simulador/', { params: { telefono } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulador', telefono] })
      queryClient.invalidateQueries({ queryKey: ['conversaciones'] })
    },
  })
}

// --- Reportes ---------------------------------------------------------------------------------

export function useResumen(desde?: string, hasta?: string) {
  return useQuery({
    queryKey: ['resumen', desde, hasta],
    queryFn: () => get<Resumen>('/reportes/resumen/', { desde, hasta }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  })
}
