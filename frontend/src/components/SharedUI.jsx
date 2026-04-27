export function Card({ children, className = '' }) {
  return <section className={`rounded-2xl border border-slate-700/70 bg-slate-900/75 p-4 shadow-card ${className}`}>{children}</section>
}

export function Button({ children, className = '', variant = 'primary', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60'
  const variants = {
    primary: 'bg-blue-500 text-slate-950 hover:bg-blue-400',
    ghost: 'border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800',
  }

  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>
}

export function Badge({ label, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-800 text-slate-100 border-slate-700',
    green: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
    yellow: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    orange: 'bg-orange-500/20 text-orange-300 border-orange-400/40',
    red: 'bg-red-500/20 text-red-300 border-red-400/40',
  }

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{label}</span>
}

export function TableHead({ children }) {
  return <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">{children}</th>
}
