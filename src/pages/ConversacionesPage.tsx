import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ChatThread } from '../components/pedidos/ChatThread'
import { EmptyState } from '../components/ui/Field'
import { BotIcon, ChatIcon, SearchIcon, SendIcon } from '../components/ui/Icons'
import { PageHeader } from '../components/ui/PageHeader'
import { Badge, EstadoBadge } from '../components/ui/StatusBadge'
import { cardClass, primaryButtonClass, smallButtonClass } from '../components/ui/styles'
import { errorMessage } from '../lib/api'
import { formatPhone, initials, minutesAgo } from '../lib/format'
import { useConversaciones, useEstadoConversacion, useMensajes, useResponderConversacion } from '../lib/queries'
import type { Conversacion } from '../lib/types'

function Panel({ conversacion }: { conversacion: Conversacion }) {
  const mensajes = useMensajes(conversacion.id)
  const responder = useResponderConversacion(conversacion.id)
  const cambiarEstado = useEstadoConversacion(conversacion.id)
  const [texto, setTexto] = useState('')
  const bot = conversacion.estado === 'bot'

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!texto.trim()) return
    responder.mutate(texto.trim(), { onSuccess: () => setTexto('') })
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div className="min-w-0">
          <p className="truncate font-heading font-bold text-slate-900">{conversacion.cliente_nombre || formatPhone(conversacion.telefono)}</p>
          <p className="text-xs text-slate-500">
            +{conversacion.telefono}
            {conversacion.simulada && ' · chat del simulador'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {conversacion.pedido_activo && (
            <Link to="/pedidos-whatsapp" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              #{conversacion.pedido_activo.numero} <EstadoBadge estado={conversacion.pedido_activo.estado} />
            </Link>
          )}
          <button
            type="button"
            className={smallButtonClass}
            disabled={cambiarEstado.isPending}
            onClick={() => cambiarEstado.mutate(bot ? 'humano' : 'bot')}
          >
            <BotIcon className="size-3.5" />
            {bot ? 'Pausar asistente' : 'Reactivar asistente'}
          </button>
        </div>
      </header>
      <ChatThread mensajes={mensajes.data ?? []} className="min-h-80 flex-1 rounded-none" />
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 p-3">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={bot ? 'Escribe para tomar el chat (pausa al asistente)…' : 'Escribe una respuesta…'}
          aria-label="Mensaje"
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
        />
        <button type="submit" className={`${primaryButtonClass} !py-2.5`} disabled={responder.isPending} aria-label="Enviar">
          <SendIcon className="size-4" />
        </button>
      </form>
      {responder.error && <p className="px-4 pb-3 text-xs text-brand-dark">{errorMessage(responder.error)}</p>}
    </div>
  )
}

export function ConversacionesPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const conversaciones = useConversaciones(search)
  const lista = conversaciones.data?.results ?? []
  const activa = lista.find((c) => c.id === selected) ?? lista[0]

  return (
    <>
      <PageHeader eyebrow="WhatsApp" title="Conversaciones" subtitle="Chats con tus clientes, atendidos por el asistente IA o por tu equipo." />
      <div className={`grid overflow-hidden lg:h-[calc(100svh-15rem)] lg:grid-cols-[20rem_minmax(0,1fr)] ${cardClass}`}>
        <aside className="flex min-h-0 flex-col border-b border-slate-200 lg:border-r lg:border-b-0">
          <div className="relative p-3">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-6 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente o teléfono"
              aria-label="Buscar conversaciones"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-sm outline-none focus:border-brand focus:bg-white"
            />
          </div>
          <ul className="max-h-80 flex-1 overflow-y-auto lg:max-h-none">
            {lista.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelected(c.id)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                    activa?.id === c.id ? 'bg-red-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    {initials(c.cliente_nombre || '?')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">{c.cliente_nombre || formatPhone(c.telefono)}</span>
                      <span className="shrink-0 text-[11px] text-slate-400">{c.ultimo_mensaje_en ? minutesAgo(c.ultimo_mensaje_en) : ''}</span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className="line-clamp-1 flex-1 text-xs text-slate-500">
                        {c.ultimo_mensaje?.direccion === 'saliente' ? 'Tú: ' : ''}
                        {c.ultimo_mensaje?.texto ?? ''}
                      </span>
                      {c.no_leidos > 0 && (
                        <span className="flex min-w-5 items-center justify-center rounded-full bg-success px-1.5 text-[11px] font-bold text-white">
                          {c.no_leidos}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 flex gap-1.5">
                      {c.estado === 'humano' && <Badge tone="blue">Personal</Badge>}
                      {c.simulada && <Badge tone="amber">Simulador</Badge>}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section className="flex min-h-0 flex-col">
          {activa ? (
            <Panel key={activa.id} conversacion={activa} />
          ) : (
            <EmptyState
              icon={<ChatIcon />}
              title={conversaciones.isPending ? 'Cargando chats…' : 'Aún no hay conversaciones'}
              text="Cuando un cliente escriba al WhatsApp de la pollería, su chat aparecerá aquí."
            />
          )}
        </section>
      </div>
    </>
  )
}
