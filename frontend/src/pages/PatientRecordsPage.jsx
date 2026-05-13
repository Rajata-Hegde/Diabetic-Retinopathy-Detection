import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, User, Calendar, ShieldAlert, Eye, FileText, Download, X, Hash, Activity, Printer, Sparkles, BrainCircuit, ShieldCheck, ChevronRight } from 'lucide-react'

function PatientRecordsPage({ records, onDelete }) {
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
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
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

  const exportForensicPDF = (record) => {
    const printWindow = window.open('', '_blank');
    
    const pdfFormat = (text) => {
      if (!text) return "";
      return text
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\n/g, '<br/>');
    };

    const auditHtml = (record.clinical_audit || "").split('\n').map(line => {
      if (!line.trim()) return '';
      const parts = line.split(':');
      if (parts.length > 1) {
        return `<li><span style="color: #0ea5e9; font-weight: 800;">${parts[0]}:</span> ${parts.slice(1).join(':')}</li>`;
      }
      return `<li>${line}</li>`;
    }).join('');

    const html = `
      <html>
        <head>
          <title>DiabEyetic Insight - Forensic Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; background: #fff; padding: 0; margin: 0; color: #0f172a; }
            .page { padding: 50px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #0f172a; padding-bottom: 20px; margin-bottom: 40px; }
            .brand { font-size: 24px; font-weight: 900; letter-spacing: -1px; }
            .brand span { color: #0ea5e9; }
            .meta { text-align: right; }
            .meta-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; }
            .meta-value { font-size: 14px; font-weight: 700; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin-bottom: 40px; }
            .section { margin-bottom: 40px; }
            .section-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #0ea5e9; margin-bottom: 15px; border-left: 4px solid #0ea5e9; padding-left: 15px; }
            .evidence-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
            .evidence-card { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
            .evidence-img { width: 100%; aspect-ratio: 1; object-fit: cover; background: #000; }
            .evidence-label { padding: 8px; font-size: 10px; font-weight: 800; background: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0; text-transform: uppercase; }
            .audit-list { list-style: none; padding: 0; font-family: monospace; font-size: 11px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .audit-list li { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed #e2e8f0; }
            .narrative { font-size: 14px; line-height: 1.7; color: #334155; background: #f0f9ff; padding: 30px; border-radius: 16px; border: 1px solid #bae6fd; font-style: italic; }
            .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="brand">DiabEyetic<span> Insight</span></div>
              <div class="meta">
                <div class="meta-label">Diagnostic Sequence</div>
                <div class="meta-value">${record.id}</div>
                <div class="meta-label" style="margin-top: 10px;">Screening Date</div>
                <div class="meta-value">${record.lastScan}</div>
              </div>
            </div>

            <div class="grid">
              <div>
                <div class="section-title">Diagnostic Verdict</div>
                <div style="font-size: 32px; font-weight: 900;">${record.grade_name || `Grade ${record.grade}`}</div>
                <div style="color: #0ea5e9; font-weight: 700;">${record.confidence}% AI Confidence Consensus</div>
              </div>
              <div style="text-align: right;">
                <div class="section-title" style="border-left: 0; border-right: 4px solid #0ea5e9; padding-right: 15px;">Risk Assessment</div>
                <div style="font-size: 24px; font-weight: 900; color: ${record.risk === 'Critical' ? '#ef4444' : record.risk === 'High' ? '#f97316' : '#10b981'}">${record.risk} Status</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Visual Evidence Vault</div>
              <div class="evidence-grid">
                <div class="evidence-card"><img class="evidence-img" src="data:image/jpeg;base64,${record.images?.original}"/><div class="evidence-label">Raw Fundus Image</div></div>
                <div class="evidence-card"><img class="evidence-img" src="data:image/jpeg;base64,${record.images?.consensus}"/><div class="evidence-label">Consensus Neural Map</div></div>
                <div class="evidence-card"><img class="evidence-img" src="data:image/jpeg;base64,${record.images?.gradcam}"/><div class="evidence-label">Grad-CAM Activation</div></div>
                <div class="evidence-card"><img class="evidence-img" src="data:image/jpeg;base64,${record.images?.shap}"/><div class="evidence-label">SHAP Feature Attribution</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Clinical Audit Log</div>
              <ul class="audit-list">${auditHtml}</ul>
            </div>

            <div class="section">
              <div class="section-title">Automated Clinical Narrative</div>
              <div class="narrative">${pdfFormat(record.patient_report || "")}</div>
            </div>

            <div class="footer">
              CONFIDENTIAL MEDICAL RECORD • GENERATED BY DIABEYETIC INSIGHT AI SUITE • NOT A REPLACEMENT FOR PROFESSIONAL CLINICAL ADVICE
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  return (
    <div className="relative min-h-[85vh] rounded-[48px] overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
         <img 
          src="/assets/vault_bg.png" 
          className="h-full w-full object-cover opacity-30 scale-105" 
          alt="Vault Background"
         />
         <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#020617]/90 to-[#020617]/50" />
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 p-12 space-y-10"
      >
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <div className="h-1 w-8 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Archival Intelligence</span>
              </div>
              <h2 className="text-6xl font-black text-white tracking-tighter">Diagnostic Vault</h2>
              <p className="mt-2 text-slate-400 font-medium">Historical diagnostic ledger with forensic multi-modal evidence.</p>
           </div>
           
           <div className="flex items-center gap-3 p-2 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-xl">
             {['All', 'Critical', 'High', 'Medium', 'Low'].map(risk => (
               <button
                 key={risk}
                 onClick={() => setFilterRisk(risk)}
                 className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterRisk === risk
                     ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                     : 'text-slate-500 hover:text-white'
                   }`}
               >
                 {risk}
               </button>
             ))}
           </div>
        </div>

        {/* Records Grid */}
        <motion.div variants={container} className="grid gap-6">
          {filteredRecords.length > 0 ? filteredRecords.map(record => (
            <motion.div
              key={record.id}
              variants={item}
              whileHover={{ x: 10 }}
              onClick={() => setSelectedRecord(record)}
              className="group premium-glass p-6 rounded-[32px] border border-white/5 flex items-center gap-8 cursor-pointer relative overflow-hidden backdrop-blur-3xl shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center text-emerald-400 border border-white/5 overflow-hidden">
                {record.images?.original ? (
                  <img src={`data:image/jpeg;base64,${record.images.original}`} className="h-full w-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <User size={24} />
                )}
              </div>

              <div className="relative z-10 flex-1 grid grid-cols-4 gap-8">
                <div className="col-span-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Source Identifier</p>
                  <h4 className="text-xl font-black text-white tracking-tight truncate">{record.name}</h4>
                  <p className="text-[10px] font-bold text-slate-500">REF: {record.id?.substring(0, 8)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">AI Verdict</p>
                  <p className="text-xl font-black text-white">{record.grade_name || `Grade ${record.grade}`}</p>
                  <p className="text-[10px] font-bold text-emerald-400">{record.confidence}% Confidence</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Timestamp</p>
                  <div className="flex items-center gap-2 mt-1">
                     <Calendar size={12} className="text-slate-500" />
                     <p className="text-sm font-bold text-slate-300">{record.lastScan}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Risk Tier</p>
                  <span className={`inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-lg ${record.risk === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-rose-500/10' :
                      record.risk === 'High' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 shadow-orange-500/10' :
                        'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/10'
                    }`}>{record.risk}</span>
                </div>
              </div>

              <div className="relative z-10 h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all">
                <ChevronRight size={24} />
              </div>
            </motion.div>
          )) : (
            <div className="py-32 flex flex-col items-center justify-center text-center">
              <div className="h-24 w-24 rounded-[40px] bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-slate-700 mb-6">
                <Hash size={40} />
              </div>
              <h4 className="text-2xl font-black text-slate-500 tracking-tight">No Diagnostic Artifacts</h4>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mt-2 italic">Awaiting first diagnostic sequence for vault population</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Record Inspection Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 lg:p-20">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecord(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-6xl max-h-full overflow-hidden premium-glass rounded-[54px] border border-white/10 flex flex-col bg-[#020617]/60"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className={`h-16 w-16 rounded-3xl flex items-center justify-center text-white shadow-2xl ${selectedRecord.risk === 'Critical' ? 'bg-rose-500 shadow-rose-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}>
                    <ShieldAlert size={32} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white tracking-tight">{selectedRecord.name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Diagnostic Sequence Audit: {selectedRecord.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                <div className="grid gap-10 lg:grid-cols-2">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Forensic Evidence</h4>
                      <div className="flex gap-2 p-1 rounded-xl bg-white/5">
                        {['original', 'gradcam', 'lime', 'shap', 'consensus'].map(id => (
                          <button
                            key={id}
                            onClick={() => setActiveXai(id)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeXai === id ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}
                          >
                            {id}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="aspect-square rounded-[48px] bg-black border border-white/10 overflow-hidden shadow-2xl relative group">
                      <img src={`data:image/jpeg;base64,${selectedRecord.images?.[activeXai]}`} className="h-full w-full object-contain" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-8 flex items-end">
                         <div className="flex items-center gap-3">
                            <Eye size={20} className="text-emerald-400" />
                            <span className="text-sm font-black text-white uppercase tracking-widest">{activeXai} Projection</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="p-8 rounded-[40px] bg-white/5 border border-white/5">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Verdict</p>
                          <h4 className={`font-black text-white leading-none ${
                             (selectedRecord.grade_name || "").length > 10 ? 'text-2xl' : 'text-4xl'
                          }`}>
                             {selectedRecord.grade_name || `Grade ${selectedRecord.grade}`}
                          </h4>
                       </div>
                       <div className="p-8 rounded-[40px] bg-white/5 border border-white/5">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Confidence</p>
                          <h4 className="text-4xl font-black text-emerald-400">{selectedRecord.confidence}%</h4>
                       </div>
                    </div>

                    <div className="p-10 rounded-[48px] bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-3xl">
                       <div className="flex items-center gap-3 mb-6">
                          <FileText size={20} className="text-emerald-400" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Patient Narrative</span>
                       </div>
                       <div className="text-lg text-slate-300 leading-relaxed font-medium italic">
                          {formatText(selectedRecord.patient_report)}
                       </div>
                    </div>

                    <div className="p-10 rounded-[48px] bg-white/5 border border-white/5">
                       <div className="flex items-center gap-3 mb-6">
                          <Activity size={20} className="text-slate-500" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Clinical Audit Log</span>
                       </div>
                       <div className="space-y-4 font-mono text-[11px] text-slate-500">
                          {(selectedRecord.clinical_audit || "").split('\n').map((line, i) => (
                             <div key={i} className="flex gap-4 border-b border-white/5 pb-2">
                                <span className="text-emerald-500/50">[{i+1}]</span>
                                <span>{line}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-white/5 flex justify-end gap-4 bg-white/5 backdrop-blur-3xl">
                <button
                  onClick={async () => {
                    if (window.confirm("Confirm permanent deletion of this diagnostic record?")) {
                      const success = await onDelete(selectedRecord.id)
                      if (success) setSelectedRecord(null)
                    }
                  }}
                  className="h-14 px-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                >
                  Delete Archive
                </button>
                <button
                  onClick={() => exportForensicPDF(selectedRecord)}
                  className="h-14 px-10 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2"
                >
                  <Download size={16} />
                  Forensic Export
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
