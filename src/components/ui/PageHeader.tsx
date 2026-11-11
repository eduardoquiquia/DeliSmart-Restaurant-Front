export function PageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <header className="mb-6">
      <p className="text-[11px] font-semibold tracking-widest text-brand uppercase">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </header>
  )
}
