import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { FormError } from '../components/ui/Field'
import { BoardIcon, CheckIcon, WhatsAppIcon } from '../components/ui/Icons'
import { Logo } from '../components/ui/Logo'
import { inputClass, primaryButtonClass } from '../components/ui/styles'
import { errorMessage } from '../lib/api'

const BENEFICIOS = [
  { Icon: WhatsAppIcon, text: 'Pedidos por WhatsApp atendidos por IA, con comprobante y ubicación.' },
  { Icon: CheckIcon, text: 'Valida pagos de Yape, Plin o transferencia en un clic.' },
  { Icon: BoardIcon, text: 'Tablero de cocina y delivery en tiempo real.' },
]

export function LoginPage() {
  const { isAuthenticated, signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await signIn(username.trim(), password)
    } catch (err) {
      setError(errorMessage(err, 'No pudimos iniciar sesión.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-brand p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 size-80 rounded-full bg-brand-dark/60" />
        <p className="relative font-heading text-2xl font-extrabold">DeliSmart</p>
        <div className="relative max-w-md">
          <h1 className="font-heading text-4xl leading-tight font-extrabold">Tu pollería, atendida a la velocidad de WhatsApp.</h1>
          <ul className="mt-8 space-y-4">
            {BENEFICIOS.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-white/90">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="size-5" />
                </span>
                <span className="pt-1.5 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/70">© {new Date().getFullYear()} DeliSmart · Panel de la pollería</p>
      </section>

      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Logo />
          <h2 className="mt-8 text-2xl font-extrabold tracking-tight text-slate-900">Ingresa a tu panel</h2>
          <p className="mt-1 text-sm text-slate-500">Personal de la pollería: administrador, caja o cocina.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Usuario o correo</span>
              <input
                className={inputClass}
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Contraseña</span>
              <input
                className={inputClass}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <FormError message={error} />
            <button type="submit" disabled={submitting} className={`w-full ${primaryButtonClass}`}>
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
