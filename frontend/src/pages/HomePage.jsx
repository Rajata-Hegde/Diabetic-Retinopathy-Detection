import { motion } from 'framer-motion'
import { Zap, ArrowRight } from 'lucide-react'

function HomePage({ onStartAnalysis, onViewDashboard }) {
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
      {/* Hero Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          src="/assets/hero1.png" 
          alt="Medical AI Network" 
          className="h-full w-full object-cover opacity-30 mix-blend-overlay scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#020617]/80 to-[#020617]/40" />
        <div className="absolute -right-24 -top-24 h-[600px] w-[600px] rounded-full bg-sky-500/10 blur-[120px] animate-pulse" />
        <div className="absolute -left-24 bottom-0 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 flex min-h-[80vh] items-center justify-center p-12 lg:p-24 text-center">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-4xl space-y-12 flex flex-col items-center"
        >
          <motion.div variants={item} className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-sky-400 shadow-[0_0_30px_rgba(14,165,233,0.15)]">
            <Zap size={14} className="fill-current" />
            Next-Gen Diagnostic Suite
          </motion.div>

          <motion.div variants={item}>
            <h1 className="text-6xl lg:text-8xl font-black leading-[0.9] text-white tracking-tighter">
              AI Powered <br />
              <span className="hero-gradient glow-text">Retinal Insights.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-xl leading-relaxed text-slate-400 font-medium">
              A high-fidelity workspace for ophthalmologists. Verify AI predictions with multi-layered explainability and longitudinal patient tracking.
            </p>
          </motion.div>

          <motion.div variants={item} className="flex flex-wrap justify-center gap-6 pt-6">
            <button 
              onClick={onStartAnalysis}
              className="group relative h-16 rounded-2xl bg-sky-500 px-10 text-base font-bold text-white transition-all hover:bg-sky-400 hover:shadow-[0_0_50px_rgba(14,165,233,0.4)]"
            >
              <span className="flex items-center gap-3">
                Start New Analysis
                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </span>
            </button>
            <button 
              onClick={onViewDashboard}
              className="h-16 rounded-2xl border border-white/10 bg-white/5 px-10 text-base font-bold text-white transition-all hover:bg-white/10 hover:border-white/20"
            >
              Clinical Dashboard
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default HomePage
