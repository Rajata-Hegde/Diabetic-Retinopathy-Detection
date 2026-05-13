import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, AlertCircle, Clock, PieChart as PieChartIcon, Zap, LayoutDashboard, BrainCircuit, ShieldCheck, Sparkles, ArrowRight, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

function DashboardHome({ records, stats }) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const severityData = useMemo(() => {
    const grades = ['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative']
    return grades.map((label, i) => ({
      name: label,
      value: records.filter(r => r.grade === i).length
    })).filter(d => d.value > 0)
  }, [records])

  const COLORS = ['#0ea5e9', '#6366f1', '#a855f7', '#f59e0b', '#ef4444']

  const slides = [
    {
      title: "Neural Consensus Active",
      subtitle: "Multi-modal AI is auditing all incoming retinal scans for consensus match.",
      tag: "SYSTEM STATUS",
      icon: <BrainCircuit size={40} className="text-sky-400" />,
      bg: "/assets/hero1.png"
    },
    {
      title: "Diagnostic Vault Synced",
      subtitle: "All records are now secured in the MongoDB Cloud with full XAI forensic logs.",
      tag: "DATA SECURITY",
      icon: <ShieldCheck size={40} className="text-emerald-400" />,
      bg: "/assets/hero2.png"
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

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
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      {/* Cinematic Hero Carousel */}
      <motion.div variants={item} className="relative h-[400px] w-full rounded-[48px] overflow-hidden group">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <img 
              src={slides[currentSlide].bg} 
              className="h-full w-full object-cover opacity-60 scale-105 group-hover:scale-100 transition-transform duration-[3s]" 
              alt="Background"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/60 to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 p-12 flex flex-col justify-center max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            key={`content-${currentSlide}`}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-sky-400">
                {slides[currentSlide].tag}
              </span>
              <div className="h-1 w-12 rounded-full bg-sky-500/30" />
            </div>
            
            <h2 className="text-6xl font-black text-white tracking-tighter leading-none">
              {slides[currentSlide].title}
            </h2>
            <p className="text-xl text-slate-300 font-medium leading-relaxed max-w-lg">
              {slides[currentSlide].subtitle}
            </p>

            <div className="flex items-center gap-6 pt-4">
               <button className="h-14 px-10 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-sky-400 hover:text-white transition-all flex items-center gap-3">
                 System Overview <ArrowRight size={16} />
               </button>
               <div className="flex gap-2">
                 {slides.map((_, i) => (
                   <button 
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2 rounded-full transition-all duration-500 ${currentSlide === i ? 'w-12 bg-sky-500' : 'w-2 bg-white/20 hover:bg-white/40'}`} 
                   />
                 ))}
               </div>
            </div>
          </motion.div>
        </div>

        <div className="absolute right-12 bottom-12 h-24 w-24 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center">
            {slides[currentSlide].icon}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div 
              key={i}
              variants={item}
              className="premium-glass card-hover group p-8 rounded-[40px] border border-white/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon size={80} />
              </div>
              <div className="flex items-center justify-between mb-6">
                <div className="h-14 w-14 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all duration-500 shadow-lg shadow-sky-500/10">
                  <Icon size={28} />
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{stat.title}</p>
                   <div className="flex items-center gap-1 text-emerald-400 mt-1">
                      <TrendingUp size={12} />
                      <span className="text-[10px] font-black">+12%</span>
                   </div>
                </div>
              </div>
              <h3 className="text-5xl font-black text-white tracking-tighter">{stat.value}</h3>
            </motion.div>
          )
        })}
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Severity Mix Chart */}
        <motion.div variants={item} className="lg:col-span-1 premium-glass p-10 rounded-[48px] border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Diagnostic Mix</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Cohort Performance Analytics</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-sky-400">
                <PieChartIcon size={24} />
              </div>
            </div>

            <div className="h-64 w-full relative">
              {severityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                      itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col h-full items-center justify-center text-slate-700 gap-4">
                  <Activity size={32} className="opacity-20 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Awaiting Clinical Data</p>
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-3xl font-black text-white leading-none">{records.length}</span>
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Cases</span>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3">
              {severityData.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{d.name}</span>
                  <span className="ml-auto text-xs font-black text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div variants={item} className="lg:col-span-2 premium-glass p-10 rounded-[48px] border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-10">
             <div>
               <h3 className="text-2xl font-black text-white tracking-tight">Neural Pulse</h3>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Real-time Diagnostic Activity</p>
             </div>
             <div className="flex items-center gap-3">
               <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Stream</span>
             </div>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
            {records.length > 0 ? records.slice(0, 10).map((record, i) => (
              <motion.div 
                key={record.id || i} 
                whileHover={{ x: 8 }}
                className="group flex items-center gap-6 p-5 rounded-[32px] bg-white/5 border border-white/5 hover:border-sky-500/30 hover:bg-sky-500/5 transition-all cursor-pointer"
              >
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border shadow-lg ${
                  record.risk === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-rose-500/5' : 
                  record.risk === 'High' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 shadow-orange-500/5' : 
                  'bg-sky-500/10 border-sky-500/20 text-sky-400 shadow-sky-500/5'
                }`}>
                  <Zap size={24} className={record.risk === 'Critical' ? 'fill-rose-500/20' : 'fill-sky-500/20'} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-black text-white tracking-tight">{record.name}</p>
                    {record.risk === 'Critical' && <Sparkles size={14} className="text-rose-400 animate-pulse" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">ID: {record.id?.substring(0, 8)}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-700" />
                    <span className="text-[10px] font-bold text-slate-600">{record.lastScan}</span>
                  </div>
                </div>
                <div className="text-right">
                   <div className={`inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border ${
                     record.risk === 'Critical' ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/20' : 
                     record.risk === 'High' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 
                     'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                   }`}>{record.risk}</div>
                   <p className="text-[10px] font-black text-slate-500 mt-2 uppercase tracking-widest">Confidence: {record.confidence}%</p>
                </div>
              </motion.div>
            )) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                 <div className="h-24 w-24 rounded-[40px] bg-white/5 border border-white/5 flex items-center justify-center text-slate-800 mb-6">
                    <Clock size={40} />
                 </div>
                 <h4 className="text-xl font-bold text-slate-600 tracking-tight">Diagnostic Silence</h4>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700 mt-3">Start a new scan to activate the feed</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default DashboardHome
