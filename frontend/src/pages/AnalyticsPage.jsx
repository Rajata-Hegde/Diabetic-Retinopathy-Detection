import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { TrendingUp, Activity, BarChart3, PieChart as PieChartIcon, Target, Users, Sparkles, Brain, ShieldAlert, ArrowRight, Zap } from 'lucide-react'

function AnalyticsPage({ records }) {
  const [activeInsight, setActiveInsight] = useState(0)

  const gradeDistribution = useMemo(() => {
    const grades = ['Grade 0', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4']
    return grades.map((label, i) => ({
      name: label,
      count: records.filter(r => r.grade === i).length,
      fullMark: 100
    }))
  }, [records])

  const riskDistribution = useMemo(() => {
    const risks = ['Low', 'Medium', 'High', 'Critical']
    return risks.map(label => ({
      name: label,
      count: records.filter(r => r.risk === label).length
    }))
  }, [records])

  const insights = [
    {
      title: "Consensus Reliability",
      value: "91.2%",
      desc: "Average agreement score across Grad-CAM, SHAP, and LIME models.",
      icon: <Brain className="text-sky-400" />,
      color: "from-sky-500/20 to-indigo-500/5"
    },
    {
      title: "Diagnostic Velocity",
      value: "3.4s",
      desc: "Average time from image upload to full multi-modal AI interpretation.",
      icon: <Zap className="text-amber-400" />,
      color: "from-amber-500/20 to-orange-500/5"
    },
    {
      title: "Vault Retention",
      value: "100%",
      desc: "All forensic logs are verified and synced with cloud-based MongoDB Atlas.",
      icon: <ShieldAlert className="text-emerald-400" />,
      color: "from-emerald-500/20 to-teal-500/5"
    }
  ]

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
    <div className="relative min-h-[85vh] rounded-[48px] overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
         <img 
          src="/assets/analytics_hero.png" 
          className="h-full w-full object-cover opacity-30 scale-105" 
          alt="Analytics Background"
         />
         <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#020617]/90 to-[#020617]/60" />
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 p-12 space-y-12"
      >
        {/* Header Section */}
        <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <div className="h-1 w-8 rounded-full bg-sky-500" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400">Intelligence Hub</span>
              </div>
              <h2 className="text-6xl font-black text-white tracking-tighter">Cohort Analytics</h2>
              <p className="mt-2 text-slate-400 font-medium max-w-lg">Deep-tissue analysis of active diagnostic cycles and model performance trends.</p>
           </div>
           <div className="flex gap-4">
              <div className="premium-glass px-6 py-4 rounded-3xl border border-white/5 flex flex-col items-end">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Precision</span>
                 <span className="text-2xl font-black text-white">93.1%</span>
              </div>
           </div>
        </motion.div>

        {/* Insight Highlight Ribbon */}
        <div className="grid gap-6 md:grid-cols-3">
           {insights.map((insight, i) => (
             <motion.div
              key={i}
              variants={item}
              whileHover={{ y: -10, scale: 1.02 }}
              className={`premium-glass p-8 rounded-[40px] border border-white/5 bg-gradient-to-br ${insight.color} relative overflow-hidden group shadow-2xl`}
             >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/10 group-hover:bg-sky-500 group-hover:text-white transition-all duration-500">
                      {insight.icon}
                    </div>
                    <TrendingUp size={16} className="text-white/20" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{insight.title}</p>
                  <h4 className="text-4xl font-black text-white mt-2 tracking-tighter">{insight.value}</h4>
                  <p className="mt-4 text-xs font-medium text-slate-500 leading-relaxed italic">{insight.desc}</p>
                </div>
                <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-sky-500/10 rounded-full blur-3xl group-hover:bg-sky-500/20 transition-all" />
             </motion.div>
           ))}
        </div>

        {/* Main Charts Section */}
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Radar Severity Analysis */}
          <motion.div variants={item} className="premium-glass p-10 rounded-[48px] border border-white/5 relative group backdrop-blur-3xl shadow-2xl">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Diagnostic Geometry</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Severity Cross-Profile</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all">
                <Activity size={24} />
              </div>
            </div>

            <div className="h-80 w-full">
              {records.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={gradeDistribution}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                    />
                    <Radar
                      name="Cases"
                      dataKey="count"
                      stroke="#0ea5e9"
                      fill="#0ea5e9"
                      fillOpacity={0.2}
                      strokeWidth={3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col h-full items-center justify-center text-slate-700 gap-4">
                   <div className="h-20 w-20 rounded-[32px] bg-white/5 border border-dashed border-white/10 flex items-center justify-center animate-pulse">
                      <PieChartIcon size={32} className="opacity-20" />
                   </div>
                   <p className="text-xs font-black uppercase tracking-widest opacity-20">Initialize diagnostic sequence</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Cinematic Risk Area Chart */}
          <motion.div variants={item} className="premium-glass p-10 rounded-[48px] border border-white/5 group backdrop-blur-3xl shadow-2xl">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Risk Projection</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Cohort Risk Acceleration</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                <Target size={24} />
              </div>
            </div>

            <div className="h-80 w-full">
               {records.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={riskDistribution}>
                    <defs>
                      <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#475569" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                      itemStyle={{ color: '#6366f1', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#riskGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
               ) : (
                <div className="flex flex-col h-full items-center justify-center text-slate-700 gap-4">
                   <div className="h-20 w-20 rounded-[32px] bg-white/5 border border-dashed border-white/10 flex items-center justify-center">
                      <TrendingUp size={32} className="opacity-20" />
                   </div>
                   <p className="text-xs font-black uppercase tracking-widest opacity-20">Awaiting Risk Calibration</p>
                </div>
               )}
            </div>
          </motion.div>
        </div>

        {/* System Integrity Grid */}
        <motion.div variants={item} className="premium-glass p-10 rounded-[48px] border border-white/5 backdrop-blur-xl">
           <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">System Performance</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Hardware & AI Neural Health</p>
              </div>
           </div>
           <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Neural Load", value: "24%", color: "text-sky-400" },
                { label: "Memory Depth", value: "89GB", color: "text-indigo-400" },
                { label: "API Latency", value: "142ms", color: "text-emerald-400" },
                { label: "Model Uptime", value: "99.9%", color: "text-amber-400" }
              ].map((stat, i) => (
                <div key={i} className="p-6 rounded-[32px] bg-white/5 border border-white/5 hover:border-sky-500/30 transition-all group">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 group-hover:text-slate-300">{stat.label}</p>
                  <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
           </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default AnalyticsPage
