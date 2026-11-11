import type { ReactNode } from 'react'

type FieldProps = { label: string; hint?: string; error?: string; children: ReactNode; className?: string }

export function Field({ label, hint, error, children, className = '' }: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-brand-dark">{error}</span>}
    </label>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-brand-dark">
      {message}
    </p>
  )
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-brand">{icon}</span>
      <p className="mt-1 font-heading font-bold text-slate-900">{title}</p>
      <p className="max-w-sm text-sm text-slate-500">{text}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
