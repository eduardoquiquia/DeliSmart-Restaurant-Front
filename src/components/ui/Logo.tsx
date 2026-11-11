export function LogoMark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path
        className="fill-brand"
        d="M11 2h20a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8h-.5l5.5 2H14a8 8 0 0 1-8-8L3 10a8 8 0 0 1 8-8Z"
      />
      <path
        fill="#fff"
        d="M14 11h7.4c5.7 0 9.6 3.6 9.6 9s-3.9 9-9.6 9H14V11Zm5 4.2v9.6h2.2c2.8 0 4.7-1.9 4.7-4.8s-1.9-4.8-4.7-4.8H19Z"
      />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5 font-heading text-xl font-extrabold tracking-tight text-slate-900">
      <LogoMark />
      <span>
        Deli<span className="text-brand">Smart</span>
      </span>
    </span>
  )
}
