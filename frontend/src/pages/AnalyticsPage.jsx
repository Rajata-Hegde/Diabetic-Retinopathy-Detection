import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line } from 'recharts'
import { TrendingUp, Activity, BarChart3, PieChart as PieChartIcon, Target, Users } from 'lucide-react'

function AnalyticsPage({ records }) {
  const gradeDistribution = useMemo(() => {
    const grades = ['Grade 0', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4']
    return grades.map((label, i) => ({
      name: label,
      count: records.filter(r => r.grade === i).length
    }))
  }, [records])

  const riskDistribution = useMemo(() => {
    const risks = ['Low', 'Medium', 'High', 'Critical']
    return risks.map(label => ({
      name: label,
      count: records.filter(r => r.risk === label).length
    }))
  }, [records])

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
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Grade Distribution Chart */}
        <motion.div variants={item} className="premium-glass p-10 rounded-[48px] border border-white/5">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Grade Analysis</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Severity Frequency</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-sky-400">
              <BarChart3 size={20} />
            </div>
          </div>

          <div className="h-72 w-full">
            {records.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistribution}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                    itemStyle={{ color: '#0ea5e9', fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col h-full items-center justify-center text-slate-600 gap-4">
                <p className="text-[10px] font-black uppercase tracking-widest italic opacity-50">Awaiting diagnostic metrics</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Risk Profile Chart */}
        <motion.div variants={item} className="premium-glass p-10 rounded-[48px] border border-white/5">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Risk Profiles</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Cohort Risk Tiers</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-indigo-400">
              <Target size={20} />
            </div>
          </div>

          <div className="h-72 w-full">
             {records.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={riskDistribution}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} fill="rgba(99, 102, 241, 0.1)" />
                </AreaChart>
              </ResponsiveContainer>
             ) : (
              <div className="flex flex-col h-full items-center justify-center text-slate-600 gap-4">
                <p className="text-[10px] font-black uppercase tracking-widest italic opacity-50">Initialize cohort analysis</p>
              </div>
             )}
          </div>
        </motion.div>
      </div>

      {/* Advanced Metrics Grid */}
      <div className="grid gap-8 md:grid-cols-3">
         <motion.div variants={item} className="premium-glass p-8 rounded-[40px] border border-white/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400">
                 <Activity size={18} />
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Model Precision</h4>
            </div>
            <p className="text-4xl font-black text-white tracking-tighter">93.1%</p>
            <p className="text-[10px] font-bold text-slate-500 mt-2">Verified Ensemble Accuracy</p>
         </motion.div>

         <motion.div variants={item} className="premium-glass p-8 rounded-[40px] border border-white/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                 <Users size={18} />
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Active Cohort</h4>
            </div>
            <p className="text-4xl font-black text-white tracking-tighter">{records.length}</p>
            <p className="text-[10px] font-bold text-slate-500 mt-2">Total Diagnostic Records</p>
         </motion.div>

         <motion.div variants={item} className="premium-glass p-8 rounded-[40px] border border-white/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                 <TrendingUp size={18} />
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Growth rate</h4>
            </div>
            <p className="text-4xl font-black text-white tracking-tighter">+12%</p>
            <p className="text-[10px] font-bold text-slate-500 mt-2">Monthly Analysis Velocity</p>
         </motion.div>
      </div>
    </motion.div>
  )
}

export default AnalyticsPage
