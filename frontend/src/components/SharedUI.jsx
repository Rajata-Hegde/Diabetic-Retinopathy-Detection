export function Card({ children, className = '' }) {
  return <section className={`glass-panel card-float rounded-[24px] border border-slate-700/80 p-5 shadow-[0_14px_34px_rgba(2,6,23,0.16)] ${className}`}>{children}</section>
}

export function Button({ children, className = '', variant = 'primary', ...props }) {
  const base =
    'inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60'
  const variants = {
    primary: 'bg-sky-500 text-white hover:-translate-y-0.5 hover:bg-sky-400',
    ghost: 'border border-slate-700 bg-slate-900 text-slate-100 hover:-translate-y-0.5 hover:bg-slate-800',
    soft: 'border border-sky-500/20 bg-sky-500/10 text-sky-200 hover:-translate-y-0.5 hover:bg-sky-500/15',
  }

  return <button className={`${base} ${variants[variant] ?? variants.primary} ${className}`} {...props}>{children}</button>
}

export function Badge({ label, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-700 bg-slate-800 text-slate-200',
    green: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
    blue: 'border-sky-500/20 bg-sky-500/10 text-sky-200',
    yellow: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
    orange: 'border-orange-500/20 bg-orange-500/10 text-orange-200',
    red: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
  }

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{label}</span>
}

export function TableHead({ children }) {
  return <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{children}</th>
}
