import { useEffect, useRef, type ReactNode } from 'react'
import { CloseIcon } from './Icons'

type ModalProps = {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  size?: 'md' | 'lg' | 'xl'
}

const SIZES = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

export function Modal({ title, subtitle, onClose, children, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label={title}
      className={`m-auto w-[calc(100%-2rem)] ${SIZES[size]} rounded-2xl p-0 shadow-2xl`}
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </dialog>
  )
}
