import { useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { Field, FormError } from '../components/ui/Field'
import { CheckIcon } from '../components/ui/Icons'
import { PageHeader } from '../components/ui/PageHeader'
import { QueryBoundary } from '../components/ui/QueryBoundary'
import { Badge } from '../components/ui/StatusBadge'
import { cardClass, inputClass, primaryButtonClass } from '../components/ui/styles'
import { errorMessage } from '../lib/api'
import { formatDate } from '../lib/format'
import { useIntegraciones, useRestaurante, useUpdateRestaurante } from '../lib/queries'
import type { Restaurante } from '../lib/types'

const EDITABLES = [
  'nombre', 'ruc', 'telefono', 'mensaje_bienvenida', 'direccion', 'latitud', 'longitud', 'radio_cobertura_km',
  'tiempo_preparacion_min', 'costo_delivery', 'yape_numero', 'yape_titular', 'plin_numero', 'plin_titular',
  'transferencia_banco', 'transferencia_cuenta', 'transferencia_cci', 'transferencia_titular', 'whatsapp_numero',
  'whatsapp_phone_number_id', 'bot_activo',
] as const

type Editable = Pick<Restaurante, (typeof EDITABLES)[number]>

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className={`p-5 sm:p-6 ${cardClass}`}>
      <h2 className="font-heading font-bold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500">{subtitle}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function Formulario({ restaurante }: { restaurante: Restaurante }) {
  const { profile } = useAuth()
  const readOnly = profile?.rol !== 'admin'
  const update = useUpdateRestaurante()
  const integraciones = useIntegraciones()
  const [values, setValues] = useState<Editable>(
    () => Object.fromEntries(EDITABLES.map((key) => [key, restaurante[key]])) as Editable,
  )
  const [saved, setSaved] = useState(false)
  const set = (patch: Partial<Editable>) => {
    setValues((current) => ({ ...current, ...patch }))
    setSaved(false)
  }

  function text(name: keyof Editable, label: string, props: { hint?: string; type?: string; step?: string; className?: string } = {}) {
    return (
      <Field label={label} hint={props.hint} className={props.className}>
        <input
          className={inputClass}
          type={props.type ?? 'text'}
          step={props.step}
          value={(values[name] as string | number | null) ?? ''}
          disabled={readOnly}
          onChange={(e) => set({ [name]: props.type === 'number' && e.target.value === '' ? null : e.target.value } as Partial<Editable>)}
        />
      </Field>
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    update.mutate(values, { onSuccess: () => setSaved(true) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className={`flex flex-wrap items-center gap-4 p-5 sm:p-6 ${cardClass}`}>
        <div className="flex-1">
          <p className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">Licencia DeliSmart</p>
          <p className="mt-1 font-heading text-lg font-bold text-slate-900 capitalize">Plan {restaurante.licencia_plan || '—'}</p>
          <p className="text-sm text-slate-500">
            Subdominio <span className="font-semibold text-slate-700">{restaurante.subdominio}</span>
            {restaurante.licencia_vencimiento && ` · vence el ${formatDate(restaurante.licencia_vencimiento)}`}
          </p>
        </div>
        <Badge tone={restaurante.licencia_vigente ? 'green' : 'red'}>{restaurante.licencia_vigente ? 'Licencia activa' : 'Licencia inactiva'}</Badge>
      </section>

      <Section title="Datos de la pollería" subtitle="Cómo te presentas a tus clientes.">
        {text('nombre', 'Nombre comercial')}
        {text('ruc', 'RUC')}
        {text('telefono', 'Teléfono fijo')}
        {text('mensaje_bienvenida', 'Mensaje de bienvenida del asistente', { className: 'sm:col-span-2' })}
      </Section>

      <Section title="Ubicación y delivery" subtitle="El asistente calcula distancia y tiempo desde este punto.">
        {text('direccion', 'Dirección del local', { className: 'sm:col-span-2' })}
        {text('latitud', 'Latitud', { type: 'number', step: '0.000001', hint: 'Ej.: -12.119400' })}
        {text('longitud', 'Longitud', { type: 'number', step: '0.000001', hint: 'Ej.: -77.033500' })}
        {text('radio_cobertura_km', 'Radio de cobertura (km)', { type: 'number', step: '0.1', hint: 'Por defecto 5 km.' })}
        {text('tiempo_preparacion_min', 'Tiempo de preparación (min)', { type: 'number', step: '1' })}
        {text('costo_delivery', 'Costo de delivery (S/)', { type: 'number', step: '0.10' })}
      </Section>

      <Section title="Datos de pago" subtitle="Se envían al cliente para pagar el adelanto del 50% o 100%.">
        {text('yape_numero', 'Número de Yape')}
        {text('yape_titular', 'Titular de Yape')}
        {text('plin_numero', 'Número de Plin')}
        {text('plin_titular', 'Titular de Plin')}
        {text('transferencia_banco', 'Banco')}
        {text('transferencia_titular', 'Titular de la cuenta')}
        {text('transferencia_cuenta', 'N.º de cuenta')}
        {text('transferencia_cci', 'CCI')}
      </Section>

      <Section title="WhatsApp" subtitle="Número que atiende el asistente con IA.">
        {text('whatsapp_numero', 'Número de WhatsApp', { hint: 'Con código de país, ej.: 51987111222' })}
        {text('whatsapp_phone_number_id', 'Phone number ID de Meta', { hint: 'Lo da Meta al registrar el número (pendiente de credenciales).' })}
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
          <input
            type="checkbox"
            className="size-4 accent-brand"
            checked={values.bot_activo}
            disabled={readOnly}
            onChange={(e) => set({ bot_activo: e.target.checked })}
          />
          Asistente IA respondiendo automáticamente
        </label>
        {integraciones.data && (
          <ul className="space-y-2 sm:col-span-2">
            {Object.entries(integraciones.data.servicios).map(([key, servicio]) => (
              <li key={key} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                <span className="font-semibold text-slate-800">{{ whatsapp: 'Meta WhatsApp Cloud API', openai: 'OpenAI', google_maps: 'Google Maps Routes' }[key]}</span>
                <span className="flex items-center gap-2">
                  {servicio.claves_faltantes.length > 0 && <span className="text-[11px] text-slate-500">Falta {servicio.claves_faltantes.join(', ')}</span>}
                  <Badge tone={servicio.simulado ? 'amber' : 'green'}>{servicio.simulado ? 'Simulado' : 'Conectado'}</Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {!readOnly && (
        <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur">
          <div className="flex-1">
            <FormError message={update.error ? errorMessage(update.error) : null} />
            {saved && (
              <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                <CheckIcon className="size-4" /> Cambios guardados
              </p>
            )}
          </div>
          <button type="submit" className={primaryButtonClass} disabled={update.isPending}>
            {update.isPending ? 'Guardando…' : 'Guardar configuración'}
          </button>
        </div>
      )}
    </form>
  )
}

export function ConfiguracionPage() {
  const restaurante = useRestaurante()
  const { profile } = useAuth()
  return (
    <>
      <PageHeader
        eyebrow="Ajustes"
        title="Configuración del restaurante"
        subtitle={profile?.rol === 'admin' ? 'Ubicación, cobertura, tiempos, pagos y WhatsApp.' : 'Solo el administrador puede editar estos datos.'}
      />
      <QueryBoundary query={restaurante}>{(data) => <Formulario restaurante={data} />}</QueryBoundary>
    </>
  )
}
