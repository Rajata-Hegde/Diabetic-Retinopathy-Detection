import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, MoreVertical, Eye, Calendar, User, ChevronRight, Hash, X, Download, ShieldAlert } from 'lucide-react'

function PatientRecordsPage({ records }) {
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [filterRisk, setFilterRisk] = useState('All')

  const filteredRecords = records.filter(r => 
    filterRisk === 'All' ? true : r.risk === filterRisk
  )

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  }

  const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  }

  return (
    <div className="space-y-8">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 premium-glass p-6 rounded-3xl border border-white/5">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-sky-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filter Risk</span>
        </div>
        <div className="flex gap-2">
          {['All', 'Critical', 'High', 'Medium', 'Low'].map(risk => (
            <button
              key={risk}
              onClick={() => setFilterRisk(risk)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filterRisk === risk 
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' 
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              {risk}
            </button>
          ))}
        </div>
      </div>

      {/* Records Table/Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4"
      >
        {filteredRecords.length > 0 ? filteredRecords.map((record, i) => (
          <motion.div
            key={record.id}
            variants={item}
            onClick={() => setSelectedPatient(record)}
            className="group premium-glass card-hover p-6 rounded-[32px] border border-white/5 flex items-center gap-8 cursor-pointer relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-sky-400 border border-white/5">
               <User size={24} />
            </div>

            <div className="relative z-10 flex-1 grid grid-cols-4 gap-8">
               <div className="col-span-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Identity</p>
                 <h4 className="text-lg font-black text-white tracking-tight">{record.name}</h4>
                 <p className="text-[10px] font-bold text-slate-500">{record.id}</p>
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Grade</p>
                 <p className="text-lg font-black text-white">DR Grade {record.grade}</p>
                 <p className="text-[10px] font-bold text-slate-500">ML Classification</p>
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Last Screen</p>
                 <p className="text-sm font-bold text-slate-300">{record.lastScan}</p>
               </div>
               <div className="text-right">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Risk Status</p>
                 <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                   record.risk === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 
                   record.risk === 'High' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 
                   'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                 }`}>{record.risk}</span>
               </div>
            </div>

            <div className="relative z-10 h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-sky-400 group-hover:bg-sky-500/10 transition-all">
               <ChevronRight size={20} />
            </div>
          </motion.div>
        )) : (
          <div className="flex flex-col items-center justify-center py-32 premium-glass rounded-[48px] border border-dashed border-white/10">
             <div className="h-20 w-20 rounded-[32px] bg-white/5 flex items-center justify-center text-slate-700 mb-6">
                <Hash size={32} />
             </div>
             <h4 className="text-xl font-bold text-slate-500 tracking-tight">No records found</h4>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mt-2">Adjust filters or start a new analysis</p>
          </div>
        )}
      </motion.div>

      {/* Patient Detail Modal */}
      <AnimatePresence>
        {selectedPatient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPatient(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl overflow-hidden rounded-[48px] bg-[#020617] border border-white/10 shadow-2xl"
            >
              <div className="flex flex-col lg:flex-row h-full max-h-[85vh]">
                <div className="lg:w-1/3 bg-white/5 p-10 border-r border-white/5">
                   <div className="h-24 w-24 rounded-[32px] bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white mb-8">
                      <User size={48} />
                   </div>
                   <h3 className="text-3xl font-black text-white tracking-tighter leading-none">{selectedPatient.name}</h3>
                   <p className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-400 mt-4">{selectedPatient.id}</p>
                   
                   <div className="mt-10 space-y-6">
                      <div className="flex items-center gap-4 text-slate-400">
                        <Calendar size={18} />
                        <span className="text-sm font-medium">Last Visit: {selectedPatient.lastScan}</span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-400">
                        <ShieldAlert size={18} />
                        <span className="text-sm font-medium">Risk Level: {selectedPatient.risk}</span>
                      </div>
                   </div>

                   <button className="mt-12 w-full h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center gap-2 text-sm font-bold text-white hover:bg-white/10 transition-all">
                      <Download size={18} />
                      Export Medical PDF
                   </button>
                </div>

                <div className="flex-1 p-10 overflow-y-auto">
                   <div className="flex items-center justify-between mb-8">
                      <h4 className="text-xl font-black text-white uppercase tracking-widest">Clinical History</h4>
                      <button 
                        onClick={() => setSelectedPatient(null)}
                        className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
                      >
                        <X size={20} />
                      </button>
                   </div>

                   <div className="space-y-6">
                      {selectedPatient.timeline?.map((event, idx) => (
                        <div key={idx} className="relative pl-8 pb-8 last:pb-0 border-l border-white/5">
                           <div className="absolute left-[-5px] top-1 h-2 w-2 rounded-full bg-sky-500 ring-4 ring-sky-500/20" />
                           <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">{selectedPatient.lastScan}</p>
                           <p className="text-sm leading-relaxed text-slate-300 font-medium">{event}</p>
                        </div>
                      ))}
                      {!selectedPatient.timeline && (
                        <div className="text-center py-12 opacity-30 italic text-slate-500">
                           No prior timeline events recorded.
                        </div>
                      )}
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PatientRecordsPage
