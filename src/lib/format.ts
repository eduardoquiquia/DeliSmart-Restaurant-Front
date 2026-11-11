export function formatMoney(value: string | number | null | undefined) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(value ?? 0))
}

/** Las fechas sin hora llegan como YYYY-MM-DD y `Date` las leería en UTC, un día antes en Lima. */
export function formatDate(value: string) {
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatShortDate(value: string) {
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

export function minutesAgo(value: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000))
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  return formatShortDate(value)
}

export function isOlderThan(value: string, minutes: number) {
  return Date.now() - new Date(value).getTime() > minutes * 60_000
}

export function formatPhone(value: string) {
  const local = value.startsWith('51') && value.length === 11 ? value.slice(2) : value
  return local.length === 9 ? `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}` : value
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

export function isoDate(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

/** Convierte un objeto en FormData, omitiendo valores vacíos. */
export function toFormData(values: Record<string, string | number | boolean | Blob | null | undefined>) {
  const form = new FormData()
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined) continue
    form.append(key, value instanceof Blob ? value : String(value))
  }
  return form
}
