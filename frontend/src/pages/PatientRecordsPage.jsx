import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, MoreVertical, Eye, Calendar, User, ChevronRight, Hash, X, Download, ShieldAlert, Activity, FileText, Zap } from 'lucide-react'

function PatientRecordsPage({ records }) {
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [filterRisk, setFilterRisk] = useState('All')
  const [activeXai, setActiveXai] = useState('consensus')

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

  const formatText = (text) => {
    if (!text) return text;
    const boldTerms = ['Grade 0', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Critical', 'High Risk', 'Urgent', 'No DR', 'Severe', 'Moderate', 'Mild'];
    let formatted = text;
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-black">$1</strong>');
    boldTerms.forEach(term => {
      const reg = new RegExp(`(${term})`, 'gi');
      formatted = formatted.replace(reg, '<strong class="text-sky-400 font-black">$1</strong>');
    });
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  }

  return (
    <div className="space-y-8">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 premium-glass p-6 rounded-3xl border border-white/5">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-sky-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filter Risk Status</span>
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

      {/* Records Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4"
      >
        {filteredRecords.length > 0 ? filteredRecords.map((record, i) => (
          <motion.div
            key={record.id || i}
            variants={item}
            onClick={() => setSelectedRecord(record)}
            className="group premium-glass card-hover p-6 rounded-[32px] border border-white/5 flex items-center gap-8 cursor-pointer relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-sky-400 border border-white/5 overflow-hidden">
               {record.images?.original ? (
                 <img src={`data:image/jpeg;base64,${record.images.original}`} className="h-full w-full object-cover opacity-50" />
               ) : (
                 <User size={24} />
               )}
            </div>

            <div className="relative z-10 flex-1 grid grid-cols-4 gap-8">
               <div className="col-span-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Source</p>
                 <h4 className="text-lg font-black text-white tracking-tight truncate max-w-[200px]">{record.name}</h4>
                 <p className="text-[10px] font-bold text-slate-500">ID: {record.id?.substring(0, 12)}...</p>
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Diagnostic</p>
                 <p className="text-lg font-black text-white">{record.grade_name || `Grade ${record.grade}`}</p>
                 <p className="text-[10px] font-bold text-slate-500">{record.confidence}% Confidence</p>
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Screening Date</p>
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
               <Eye size={20} />
            </div>
          </motion.div>
        )) : (
          <div className="flex flex-col items-center justify-center py-32 premium-glass rounded-[48px] border border-dashed border-white/10">
             <div className="h-20 w-20 rounded-[32px] bg-white/5 flex items-center justify-center text-slate-700 mb-6">
                <Hash size={32} />
             </div>
             <h4 className="text-xl font-bold text-slate-500 tracking-tight">No diagnostic history found</h4>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mt-2">Initialize analysis to populate vault</p>
          </div>
        )}
      </motion.div>

      {/* Record Depth Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecord(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="relative w-full max-w-6xl overflow-hidden rounded-[48px] bg-[#020617] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-3xl bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                    <Activity size={32} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white tracking-tight">{selectedRecord.name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">Scan ID: {selectedRecord.id}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{selectedRecord.lastScan}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedRecord(null)} className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 grid gap-10 lg:grid-cols-2">
                {/* Visual Evidence */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Neural Projection History</h4>
                    <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/5">
                      {['original', 'gradcam', 'lime', 'shap', 'consensus'].map(id => (
                        <button 
                          key={id}
                          onClick={() => setActiveXai(id)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeXai === id ? 'bg-sky-500 text-white' : 'text-slate-500'}`}
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative aspect-square rounded-[40px] bg-black border border-white/5 overflow-hidden group">
                    {selectedRecord.images?.[activeXai] ? (
                      <img src={`data:image/jpeg;base64,${selectedRecord.images[activeXai]}`} className="h-full w-full object-contain" />
                    ) : (
                      <div className="flex h-full items-center justify-center opacity-20 italic text-slate-500">Image data unavailable</div>
                    )}
                  </div>
                </div>

                {/* Report Content */}
                <div className="space-y-8">
                  <div className="p-8 rounded-[40px] bg-sky-500/5 border border-sky-500/10">
                    <div className="flex items-center gap-3 mb-6 text-sky-400">
                      <FileText size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Historical Narrative</span>
                    </div>
                    <div className="text-sm leading-relaxed text-slate-300 font-medium">
                      {formatText(selectedRecord.patient_report || "No text report available for this entry.")}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Diagnostic Score</p>
                      <p className="text-2xl font-black text-white">{selectedRecord.confidence}%</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Risk Assessment</p>
                      <p className="text-2xl font-black text-rose-400">{selectedRecord.risk}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-8 border-t border-white/5 flex justify-end gap-4 bg-white/5">
                 <button className="h-14 px-8 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all">
                    Delete Record
                 </button>
                 <button className="h-14 px-10 rounded-2xl bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-sky-400 transition-all shadow-xl shadow-sky-500/20">
                    Export Forensic Report
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PatientRecordsPage
