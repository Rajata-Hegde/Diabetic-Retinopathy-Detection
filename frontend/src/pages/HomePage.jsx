import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, ShieldCheck, TrendingUp, UploadCloud } from 'lucide-react'
import { Button, Card } from '../components/SharedUI'
import { pageTransition, summaryCards } from '../data/mockData'
import heroImage from '../assets/hero.png'

const features = [
  { icon: UploadCloud, title: 'Upload scans', details: 'Start a new screening workflow with a clear and simple upload experience.' },
  { icon: TrendingUp, title: 'Track trends', details: 'Monitor activity, severity distribution, and model performance in one place.' },
  { icon: ClipboardList, title: 'Review records', details: 'Access patient history, risk level, and follow-up details with less clutter.' },
]

function HomePage() {
  const showcaseStats = useMemo(() => summaryCards.slice(0, 3), [])

  return (
    <motion.div {...pageTransition} className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <Card className="space-y-6 bg-slate-900">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-sky-300">
                <ShieldCheck size={14} />
                AI-assisted screening
              </div>
              <div>
                <h1 className="max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl">
                  A simpler dashboard for diabetic retinopathy screening.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                  Designed to feel calm and professional, with the most important information easy to find for doctors and staff.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button>Start new analysis</Button>
                <Button variant="ghost">Open dashboard</Button>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-700 bg-slate-950 p-4">
              <img src={heroImage} alt="Retinal scan preview" className="h-64 w-full rounded-[18px] object-cover" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Risk confidence</p>
                  <p className="mt-2 text-2xl font-semibold text-white">92%</p>
                </div>
                <div className="rounded-[18px] border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Likely grade</p>
                  <p className="mt-2 text-2xl font-semibold text-white">3+</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-4 bg-slate-900">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Overview</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">What you can do here</h2>
          </div>
          <div className="space-y-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="rounded-[18px] border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-500/10 text-sky-300">
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="font-semibold text-white">{feature.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{feature.details}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-4 bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Today</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Quick summary</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {showcaseStats.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.title} className="soft-stat rounded-[18px] p-4">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-500/10 text-sky-300">
                    <Icon size={18} />
                  </span>
                  <p className="mt-4 text-sm text-slate-400">{card.title}</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{card.value}</p>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="space-y-4 bg-slate-900">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Product focus</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Designed for clarity</h2>
          </div>
          <div className="space-y-3 text-sm leading-7 text-slate-400">
            <div className="rounded-[18px] border border-slate-800 bg-slate-950 p-4">Important clinical information is surfaced first, with less decorative noise.</div>
            <div className="rounded-[18px] border border-slate-800 bg-slate-950 p-4">Pages share a consistent dark medical look so the app feels easier and more professional.</div>
            <div className="rounded-[18px] border border-slate-800 bg-slate-950 p-4">Actions, patient data, and model results remain clear without trying to feel flashy.</div>
          </div>
        </Card>
      </section>
    </motion.div>
  )
}

export default HomePage
