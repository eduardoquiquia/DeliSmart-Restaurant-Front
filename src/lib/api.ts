import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'
/** Login de los dueños; desde "Mi Plan" entran a la pollería con la sesión iniciada. */
export const LANDING_URL = (import.meta.env.VITE_LANDING_URL || 'http://localhost:3000').replace(/\/$/, '')
export const POLLING_MS = Math.min(10_000, Math.max(5_000, Number(import.meta.env.VITE_POLLING_MS) || 5_000))

const BASE_URL = `${API_URL}/api/v1`
const TOKENS_KEY = 'delismart-restaurante-tokens'
export const SESSION_EXPIRED_EVENT = 'delismart:session-expired'
export const LICENSE_BLOCKED_EVENT = 'delismart:license-blocked'

type Tokens = { access: string; refresh: string }
type RetriableConfig = InternalAxiosRequestConfig & { retried?: boolean }

export function getTokens(): Tokens | null {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY) ?? 'null')
  } catch {
    return null
  }
}

export function setTokens(tokens: Tokens) {
  try {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens))
  } catch {
    // Sin almacenamiento la sesión dura lo que la pestaña.
  }
}

export function clearTokens() {
  try {
    localStorage.removeItem(TOKENS_KEY)
  } catch {
    // Nada que limpiar.
  }
}

export const api = axios.create({ baseURL: BASE_URL })

export async function login(username: string, password: string) {
  const { data } = await axios.post<Tokens>(`${BASE_URL}/auth/login/`, { username, password })
  setTokens(data)
}

/** Canjea el enlace de un solo uso que genera "Mi Plan" en el panel admin. */
export async function loginWithSso(token: string) {
  const { data } = await axios.post<Tokens>(`${BASE_URL}/auth/sso/`, { token })
  setTokens(data)
}

api.interceptors.request.use((config) => {
  const tokens = getTokens()
  if (tokens) config.headers.Authorization = `Bearer ${tokens.access}`
  return config
})

// Varias peticiones pueden caducar a la vez: todas esperan al mismo refresh.
let refreshing: Promise<void> | null = null

function refreshAccessToken() {
  const tokens = getTokens()
  if (!tokens) return Promise.reject(new Error('Sin sesión'))
  refreshing ??= axios
    .post<{ access: string }>(`${BASE_URL}/auth/refresh/`, { refresh: tokens.refresh })
    .then(({ data }) => setTokens({ ...tokens, access: data.access }))
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  // 402: la licencia dejó de estar vigente mientras el panel estaba abierto.
  if (error.response?.status === 402) window.dispatchEvent(new Event(LICENSE_BLOCKED_EVENT))

  const config = error.config as RetriableConfig | undefined
  if (error.response?.status !== 401 || !config || config.retried || !getTokens()) throw error

  config.retried = true
  try {
    await refreshAccessToken()
  } catch {
    clearTokens()
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    throw error
  }
  return api(config)
})

/** Extrae el mensaje de un error de DRF: `detail` o el primer error de campo. */
export function errorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.') {
  if (!axios.isAxiosError(error)) return fallback
  if (!error.response) return 'No pudimos conectar con el servidor.'
  const data = error.response.data as Record<string, unknown> | undefined
  if (typeof data?.detail === 'string') return data.detail
  const first = Object.values(data ?? {})[0]
  if (typeof first === 'string') return first
  if (Array.isArray(first)) {
    const value = first[0]
    if (typeof value === 'string') return value
    if (value && typeof value === 'object') {
      const nested = Object.values(value)[0]
      if (Array.isArray(nested) && typeof nested[0] === 'string') return nested[0]
    }
  }
  return fallback
}
