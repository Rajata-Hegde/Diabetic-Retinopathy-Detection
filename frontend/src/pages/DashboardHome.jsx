import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Activity, AlertCircle, Clock, PieChart as PieChartIcon, Zap, LayoutDashboard } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

function DashboardHome({ records, stats }) {
  const severityData = useMemo(() => {
    const grades = ['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative']
    return grades.map((label, i) => ({
      name: label,
      value: records.filter(r => r.grade === i).length
    })).filter(d => d.value > 0)
  }, [records])

  const COLORS = ['#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#ef4444']

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
      {/* Top Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div 
              key={i}
              variants={item}
              className="premium-glass card-hover group p-8 rounded-[32px] border border-white/5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                  <Icon size={24} />
                </div>
                <div className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{stat.title}</p>
              <h3 className="mt-2 text-4xl font-black text-white tracking-tighter">{stat.value}</h3>
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
                <h3 className="text-2xl font-black text-white tracking-tight">System Mix</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Cohort Analysis</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-sky-400">
                <PieChartIcon size={20} />
              </div>
            </div>

            <div className="h-64 w-full">
              {severityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={10}
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
                <div className="flex flex-col h-full items-center justify-center text-slate-600 gap-4">
                  <div className="h-16 w-16 rounded-3xl border border-dashed border-slate-800 flex items-center justify-center">
                    <Activity size={24} className="opacity-20" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest">Awaiting Data</p>
                </div>
              )}
            </div>

            <div className="mt-10 space-y-3">
              {severityData.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.name}</span>
                  <span className="ml-auto text-xs font-black text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div variants={item} className="lg:col-span-2 premium-glass p-10 rounded-[48px] border border-white/5">
          <div className="flex items-center justify-between mb-10">
             <div>
               <h3 className="text-2xl font-black text-white tracking-tight">Active Stream</h3>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Real-time Diagnostic Events</p>
             </div>
             <button className="h-10 px-5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-sky-400 hover:bg-white/10 transition-all">
               System Log
             </button>
          </div>

          <div className="space-y-4">
            {records.slice(0, 5).length > 0 ? records.slice(0, 5).map((record, i) => (
              <motion.div 
                key={i} 
                whileHover={{ x: 8 }}
                className="group flex items-center gap-6 p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-sky-500/20 hover:bg-sky-500/5 transition-all cursor-pointer"
              >
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner ${
                  record.risk === 'Critical' ? 'bg-rose-500/10 text-rose-400' : 
                  record.risk === 'High' ? 'bg-orange-500/10 text-orange-400' : 
                  'bg-emerald-500/10 text-emerald-400'
                }`}>
                  <Zap size={20} className="fill-current" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-black text-white tracking-tight">{record.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{record.id}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-700" />
                    <span className="text-[10px] font-bold text-slate-600">{record.lastScan}</span>
                  </div>
                </div>
                <div className="text-right">
                   <div className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border ${
                     record.risk === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 
                     record.risk === 'High' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 
                     'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                   }`}>{record.risk}</div>
                   <p className="text-[10px] font-black text-slate-500 mt-2 uppercase tracking-widest">DR Grade {record.grade}</p>
                </div>
              </motion.div>
            )) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                 <div className="h-20 w-20 rounded-[32px] bg-white/5 border border-white/5 flex items-center justify-center text-slate-700 mb-6">
                    <Clock size={32} />
                 </div>
                 <h4 className="text-lg font-bold text-slate-500">System Idle</h4>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mt-2">New scans will appear here automatically</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default DashboardHome
