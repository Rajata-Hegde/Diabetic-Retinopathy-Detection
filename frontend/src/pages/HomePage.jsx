import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { UploadCloud, BarChart3, Users, ShieldCheck, Activity, Zap, ArrowRight, BrainCircuit } from 'lucide-react'
import { Button } from '../components/SharedUI'
import heroBg from '../assets/hero-bg.png'

const features = [
  { icon: BrainCircuit, title: 'Neural Consensus', details: 'Tri-model XAI ensemble (Grad-CAM, LIME, SHAP) for verifiable diagnostics.', color: 'text-sky-400' },
  { icon: Activity, title: 'Real-time Pulse', details: 'Immediate severity classification with live cohort impact analysis.', color: 'text-indigo-400' },
  { icon: ShieldCheck, title: 'Clinical Security', details: 'HIPAA-aligned data persistence with local encryption standards.', color: 'text-emerald-400' },
]

function HomePage({ onStartAnalysis, onViewDashboard, stats }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="relative min-h-[80vh] overflow-hidden rounded-[40px] premium-glass">
      {/* Hero Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroBg} 
          alt="Medical AI Network" 
          className="h-full w-full object-cover opacity-30 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#020617] via-[#020617]/80 to-transparent" />
      </div>

      <div className="relative z-10 grid gap-12 p-12 lg:grid-cols-2 lg:items-center">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          <motion.div variants={item} className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.15)]">
            <Zap size={14} className="fill-current" />
            Next-Gen Diagnostic Suite
          </motion.div>

          <motion.div variants={item}>
            <h1 className="text-5xl lg:text-7xl font-black leading-[0.95] text-white tracking-tighter">
              AI Powered <br />
              <span className="hero-gradient glow-text">Retinal Insights.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-400 font-medium">
              A high-fidelity workspace for ophthalmologists. Verify AI predictions with multi-layered explainability and longitudinal patient tracking.
            </p>
          </motion.div>

          <motion.div variants={item} className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={onStartAnalysis}
              className="group relative h-14 rounded-2xl bg-sky-500 px-8 text-sm font-bold text-white transition-all hover:bg-sky-400 hover:shadow-[0_0_40px_rgba(14,165,233,0.4)]"
            >
              <span className="flex items-center gap-2">
                Start New Analysis
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button 
              onClick={onViewDashboard}
              className="h-14 rounded-2xl border border-white/10 bg-white/5 px-8 text-sm font-bold text-white transition-all hover:bg-white/10"
            >
              Clinical Dashboard
            </button>
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-3 gap-8 border-t border-white/5 pt-12">
            {stats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Icon size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{stat.title}</span>
                  </div>
                  <p className="text-3xl font-black text-white tracking-tight">{stat.value}</p>
                </div>
              )
            })}
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative hidden lg:block"
        >
          <div className="relative z-10 rounded-[32px] border border-white/10 bg-black/40 p-3 backdrop-blur-3xl shadow-2xl overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             {/* <img 
               src="https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=2070&auto=format&fit=crop" 
               alt="Diagnostic UI"
               className="rounded-3xl h-[500px] w-full object-cover opacity-80"
             /> */}
             <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-4 text-white">
                  <div className="h-12 w-12 rounded-xl bg-sky-500 flex items-center justify-center">
                    <BrainCircuit size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-sky-400">Analysis Mode</p>
                    <p className="text-xl font-bold tracking-tight">Active Neural Consensus</p>
                  </div>
                </div>
             </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-sky-500/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        </motion.div>
      </div>

      <section className="grid border-t border-white/5 bg-black/20 lg:grid-cols-3">
        {features.map((feature, i) => {
          const Icon = feature.icon
          return (
            <div key={i} className="group p-10 border-r border-white/5 last:border-0 hover:bg-white/5 transition-colors">
              <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/5 ${feature.color} group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight mb-2">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500 font-medium">{feature.details}</p>
            </div>
          )
        })}
      </section>
    </div>
  )
}

export default HomePage
