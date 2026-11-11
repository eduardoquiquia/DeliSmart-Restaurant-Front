import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ChatThread } from '../components/pedidos/ChatThread'
import { FormError } from '../components/ui/Field'
import { CheckIcon, ImageIcon, MapPinIcon, RefreshIcon, SendIcon, WhatsAppIcon } from '../components/ui/Icons'
import { PageHeader } from '../components/ui/PageHeader'
import { Badge } from '../components/ui/StatusBadge'
import { cardClass, inputClass, smallButtonClass } from '../components/ui/styles'
import { errorMessage } from '../lib/api'
import { formatMoney, toFormData } from '../lib/format'
import { useEnviarSimulacion, useReiniciarSimulacion, useSimulacion } from '../lib/queries'
import type { Borrador, EstadoIntegraciones } from '../lib/types'

const TELEFONO_DEMO = '51900000001'

const SUGERENCIAS = ['Hola', 'carta', 'Quiero 2 pollo entero y 1 inca kola', 'Pago con yape, adelanto del 50%', 'resumen']

const UBICACIONES = [
  { label: 'Cerca (Miraflores)', latitud: -12.1225, longitud: -77.0301, direccion: 'Av. Larco 345, Miraflores' },
  { label: 'Lejos (Callao)', latitud: -12.0566, longitud: -77.1181, direccion: 'Av. Sáenz Peña 200, Callao' },
]

const SERVICIOS: Record<keyof EstadoIntegraciones['servicios'], string> = {
  whatsapp: 'WhatsApp Cloud API',
  openai: 'OpenAI gpt-4o-mini',
  google_maps: 'Google Maps Routes',
}

/** Captura de Yape falsa para probar el flujo sin una imagen real. */
function comprobanteDemo(): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 360
  canvas.height = 640
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#742284'
  ctx.fillRect(0, 0, 360, 640)
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(24, 120, 312, 400, 24)
  ctx.fill()
  ctx.font = 'bold 26px sans-serif'
  ctx.fillText('yape', 150, 80)
  ctx.fillStyle = '#742284'
  ctx.font = 'bold 24px sans-serif'
  ctx.fillText('¡Yapeaste!', 110, 190)
  ctx.fillStyle = '#111827'
  ctx.font = 'bold 34px sans-serif'
  ctx.fillText('Comprobante', 70, 270)
  ctx.font = '16px sans-serif'
  ctx.fillStyle = '#6b7280'
  ctx.fillText(new Date().toLocaleString('es-PE'), 80, 320)
  ctx.fillText('Simulación DeliSmart', 95, 480)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/png'))
}

const FALTANTES: [string, (b: Borrador) => boolean][] = [
  ['Platos', (b) => (b.items?.length ?? 0) > 0],
  ['Ubicación', (b) => b.latitud !== undefined],
  ['Método de pago', (b) => Boolean(b.metodo_pago)],
  ['Adelanto 50% / 100%', (b) => Boolean(b.porcentaje_adelanto)],
  ['Comprobante', (b) => Boolean(b.comprobante_mensaje_id)],
]

export function SimuladorPage() {
  const [telefono, setTelefono] = useState(TELEFONO_DEMO)
  const [nombre, setNombre] = useState('Cliente de prueba')
  const [texto, setTexto] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const simulacion = useSimulacion(telefono)
  const enviar = useEnviarSimulacion(telefono)
  const reiniciar = useReiniciarSimulacion(telefono)
  const [ultimoPedido, setUltimoPedido] = useState<{ id: number; numero: number } | null>(null)
  const borrador = simulacion.data?.conversacion?.borrador ?? {}
  const integraciones = simulacion.data?.integraciones

  function send(values: Record<string, string | number | Blob>) {
    enviar.mutate(toFormData({ telefono, nombre, ...values }), {
      onSuccess: (data) => {
        if (data.pedido_creado) setUltimoPedido(data.pedido_creado)
      },
    })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!texto.trim()) return
    send({ tipo: 'texto', texto: texto.trim() })
    setTexto('')
  }

  async function sendDemoReceipt() {
    send({ tipo: 'imagen', imagen: new File([await comprobanteDemo()], 'yape-demo.png', { type: 'image/png' }) })
  }

  return (
    <>
      <PageHeader
        eyebrow="Pruebas"
        title="Simulador de WhatsApp"
        subtitle="Escribe como un cliente: el mensaje pasa por el mismo flujo del webhook de Meta y crea pedidos reales en el panel."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <section className="mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border-8 border-slate-900 bg-slate-900 shadow-2xl">
          <header className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
            <span className="flex size-9 items-center justify-center rounded-full bg-white/20">
              <WhatsAppIcon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Pollería (asistente IA)</p>
              <p className="text-[11px] text-white/70">{enviar.isPending ? 'escribiendo…' : 'en línea'}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                reiniciar.mutate()
                setUltimoPedido(null)
              }}
              title="Reiniciar chat"
              aria-label="Reiniciar chat"
              className="rounded-lg p-1.5 hover:bg-white/10"
            >
              <RefreshIcon />
            </button>
          </header>
          <ChatThread mensajes={simulacion.data?.mensajes ?? []} className="h-[28rem] rounded-none" />
          <div className="space-y-2 bg-[#f0f2f5] p-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {SUGERENCIAS.map((sugerencia) => (
                <button
                  key={sugerencia}
                  type="button"
                  onClick={() => send({ tipo: 'texto', texto: sugerencia })}
                  disabled={enviar.isPending}
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {sugerencia}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {UBICACIONES.map(({ label, ...ubicacion }) => (
                <button
                  key={label}
                  type="button"
                  disabled={enviar.isPending}
                  onClick={() => send({ tipo: 'ubicacion', ...ubicacion })}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-white px-2 py-1.5 text-[11px] font-semibold text-sky-700 hover:bg-sky-50"
                >
                  <MapPinIcon className="size-3.5" /> {label}
                </button>
              ))}
              <button
                type="button"
                disabled={enviar.isPending}
                onClick={sendDemoReceipt}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-white px-2 py-1.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-50"
              >
                <ImageIcon className="size-3.5" /> Yape demo
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Adjuntar comprobante"
                className="rounded-full p-2 text-slate-500 hover:bg-white"
              >
                <ImageIcon />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) send({ tipo: 'imagen', imagen: file })
                  event.target.value = ''
                }}
              />
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe un mensaje"
                aria-label="Mensaje del cliente"
                className="flex-1 rounded-full border-0 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <button
                type="submit"
                disabled={enviar.isPending}
                aria-label="Enviar"
                className="flex size-10 items-center justify-center rounded-full bg-[#00a884] text-white hover:bg-[#008f6f] disabled:opacity-60"
              >
                <SendIcon className="size-4" />
              </button>
            </form>
          </div>
        </section>

        <div className="space-y-6">
          <FormError message={enviar.error ? errorMessage(enviar.error) : null} />

          {ultimoPedido && (
            <div role="status" className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-success text-white">
                <CheckIcon />
              </span>
              <div className="flex-1">
                <p className="font-heading font-bold text-slate-900">Pedido #{ultimoPedido.numero} creado</p>
                <p className="text-sm text-slate-600">Ya aparece en Pedidos WhatsApp para validar el pago.</p>
              </div>
              <Link to="/pedidos-whatsapp" className={smallButtonClass}>
                Ir a validar
              </Link>
            </div>
          )}

          <section className={`p-5 ${cardClass}`}>
            <h2 className="font-heading font-bold text-slate-900">Cliente simulado</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Teléfono (wa_id)</span>
                <input className={inputClass} value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))} />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Nombre de perfil</span>
                <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </label>
            </div>
          </section>

          <section className={`p-5 ${cardClass}`}>
            <h2 className="font-heading font-bold text-slate-900">Pedido que arma el asistente</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {FALTANTES.map(([label, listo]) => (
                <li key={label} className="flex items-center gap-2 text-sm">
                  <span
                    className={`flex size-5 items-center justify-center rounded-full ${
                      listo(borrador) ? 'bg-success text-white' : 'bg-slate-100 text-slate-300'
                    }`}
                  >
                    <CheckIcon className="size-3" />
                  </span>
                  <span className={listo(borrador) ? 'font-semibold text-slate-900' : 'text-slate-500'}>{label}</span>
                </li>
              ))}
            </ul>
            {(borrador.items?.length ?? 0) > 0 && (
              <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
                {borrador.items!.map((item) => (
                  <li key={item.plato_id} className="flex justify-between px-3 py-2">
                    <span>
                      {item.cantidad}× {item.nombre}
                    </span>
                    <span className="font-semibold">{formatMoney(Number(item.precio) * item.cantidad)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {borrador.distancia_km != null && (
                <Badge tone={borrador.fuera_de_cobertura ? 'red' : 'green'}>
                  {borrador.distancia_km.toFixed(1)} km · {borrador.tiempo_traslado_min} min
                  {borrador.fuera_de_cobertura ? ' · fuera de cobertura' : ''}
                </Badge>
              )}
              {borrador.metodo_pago && <Badge tone="violet">{borrador.metodo_pago}</Badge>}
              {borrador.porcentaje_adelanto && <Badge tone="blue">Adelanto {borrador.porcentaje_adelanto}%</Badge>}
            </div>
          </section>

          {integraciones && (
            <section className={`p-5 ${cardClass}`}>
              <h2 className="font-heading font-bold text-slate-900">Integraciones</h2>
              <p className="mt-1 text-sm text-slate-500">
                {integraciones.modo_global_simulado
                  ? 'INTEGRATIONS_MOCK=true: todo corre simulado, nada sale a Meta, OpenAI ni Google.'
                  : 'Cada servicio usa su API real cuando tiene sus claves.'}
              </p>
              <ul className="mt-3 space-y-2">
                {Object.entries(integraciones.servicios).map(([key, servicio]) => (
                  <li key={key} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                    <span className="font-semibold text-slate-800">{SERVICIOS[key as keyof typeof SERVICIOS]}</span>
                    <span className="flex items-center gap-2">
                      {servicio.claves_faltantes.length > 0 && (
                        <span className="text-[11px] text-slate-500">Falta: {servicio.claves_faltantes.join(', ')}</span>
                      )}
                      <Badge tone={servicio.simulado ? 'amber' : 'green'}>{servicio.simulado ? 'Simulado' : 'Real'}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
