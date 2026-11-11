import { useEffect, useRef } from 'react'
import { formatTime } from '../../lib/format'
import type { Mensaje } from '../../lib/types'
import { BotIcon, MapPinIcon } from '../ui/Icons'

const AUTORES: Record<Mensaje['autor'], string> = {
  cliente: 'Cliente',
  asistente: 'Asistente IA',
  personal: 'Personal',
  sistema: 'Aviso automático',
}

/** Negritas de WhatsApp (*texto*) y saltos de línea. */
function WhatsAppText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, index) => (
        <span key={index} className="block min-h-[1em]">
          {line.split(/(\*[^*\n]+\*)/g).map((part, i) =>
            part.startsWith('*') && part.endsWith('*') && part.length > 2 ? <strong key={i}>{part.slice(1, -1)}</strong> : part,
          )}
        </span>
      ))}
    </>
  )
}

function Bubble({ mensaje }: { mensaje: Mensaje }) {
  const own = mensaje.direccion === 'saliente'
  return (
    <div className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
          own ? 'rounded-tr-sm bg-[#d9fdd3] text-slate-800' : 'rounded-tl-sm bg-white text-slate-800'
        }`}
      >
        {own && (
          <p className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
            {mensaje.autor === 'asistente' && <BotIcon className="size-3" />}
            {AUTORES[mensaje.autor]}
          </p>
        )}
        {mensaje.tipo === 'imagen' && mensaje.imagen && (
          <a href={mensaje.imagen} target="_blank" rel="noreferrer">
            <img src={mensaje.imagen} alt="Imagen enviada por el cliente" className="mb-1 max-h-56 rounded-lg object-cover" />
          </a>
        )}
        {mensaje.tipo === 'imagen' && !mensaje.imagen && (
          <p className="text-xs text-slate-500 italic">[Imagen no descargada: faltan credenciales de WhatsApp]</p>
        )}
        {mensaje.tipo === 'ubicacion' && mensaje.latitud && (
          <a
            href={`https://www.google.com/maps?q=${mensaje.latitud},${mensaje.longitud}`}
            target="_blank"
            rel="noreferrer"
            className="mb-1 flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-sky-700"
          >
            <MapPinIcon />
            Ubicación compartida
          </a>
        )}
        {mensaje.texto && <WhatsAppText text={mensaje.texto} />}
        <p className="mt-0.5 text-right text-[10px] text-slate-400">
          {formatTime(mensaje.creado_en)}
          {mensaje.estado_envio === 'error' && <span className="ml-1 font-semibold text-brand">· no enviado</span>}
        </p>
      </div>
    </div>
  )
}

export function ChatThread({ mensajes, className = 'h-96' }: { mensajes: Mensaje[]; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const last = mensajes.at(-1)?.id

  // Solo se desplaza el chat; scrollIntoView movería también la página.
  useEffect(() => {
    const container = containerRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [last])

  return (
    <div ref={containerRef} className={`overflow-y-auto rounded-xl bg-[#efeae2] p-3 ${className}`}>
      {mensajes.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">Aún no hay mensajes.</p>
      ) : (
        <div className="space-y-2">
          {mensajes.map((mensaje) => (
            <Bubble key={mensaje.id} mensaje={mensaje} />
          ))}
        </div>
      )}
    </div>
  )
}
