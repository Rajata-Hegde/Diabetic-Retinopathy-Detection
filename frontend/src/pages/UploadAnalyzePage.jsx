import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScanSearch, Upload, BrainCircuit, Activity, ShieldCheck, Zap, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react'

function UploadAnalyzePage({ onScanComplete }) {
  const [previewImage, setPreviewImage] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeXai, setActiveXai] = useState('none')
  const [result, setResult] = useState({
    grade: 0,
    confidence: 0,
    risk: 'Low',
    explanations: { gradcam: null, lime: null, shap: null, consensus: null },
    interpretation: {
      summary: "",
      clinical_audit: "",
      patient_report: "",
      agreement_score: 0,
      methods_available: []
    }
  })
  const [reportTab, setReportTab] = useState('patient')
  const [error, setError] = useState(null)

  useEffect(() => {
    return () => {
      if (previewImage) URL.revokeObjectURL(previewImage)
    }
  }, [previewImage])

  const uploadFile = (file) => {
    if (!file || !['image/jpeg', 'image/png'].includes(file.type)) return
    if (previewImage) URL.revokeObjectURL(previewImage)
    setPreviewImage(URL.createObjectURL(file))
    setSelectedFile(file)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return
    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const response = await fetch('http://localhost:8000/analyze', { method: 'POST', body: formData })
      
      if (!response.ok) throw new Error('Analysis engine unavailable')
      const data = await response.json()

      if (data && typeof data.grade === 'number') {
        const { grade, confidence, explanations, interpretation } = data
        const risk = grade >= 4 ? 'Critical' : grade >= 3 ? 'High' : grade >= 2 ? 'Medium' : 'Low'
        
        const res = { grade, confidence, risk, explanations, interpretation }
        setResult(res)
        setActiveXai('gradcam')

        if (onScanComplete) {
          onScanComplete({
            id: `PAT-${Math.floor(Math.random() * 90000) + 10000}`,
            name: "New Patient Scan",
            age: "--",
            lastScan: new Date().toLocaleDateString(),
            grade,
            risk,
            timeline: ["Screening performed via AI Neural Bridge"]
          })
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-5">
      {/* Left Column: Upload & Preview */}
      <div className="lg:col-span-3 space-y-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-glass p-10 rounded-[48px] border border-white/5"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Source Intake</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Step 01: Retinal Fundus</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400">
               <Upload size={24} />
            </div>
          </div>

          <label
            className={`group relative block rounded-[32px] border-2 border-dashed p-12 text-center transition-all cursor-pointer overflow-hidden ${
              isDragging ? 'border-sky-500 bg-sky-500/10' : 'border-white/5 bg-black/20 hover:border-white/20'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); uploadFile(e.dataTransfer.files?.[0]) }}
          >
            <div className="relative z-10">
              <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                <Upload size={32} />
              </div>
              <p className="text-xl font-bold text-white tracking-tight">Deploy Data Source</p>
              <p className="mt-2 text-sm text-slate-500 font-medium italic">Drop JPG/PNG or browse clinical files</p>
            </div>
            <input type="file" className="hidden" onChange={(e) => uploadFile(e.target.files?.[0])} />
          </label>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="premium-glass p-10 rounded-[48px] border border-white/5 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">XAI Projection</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Step 02: Neural Overlay</p>
            </div>
            <button 
              onClick={handleAnalyze} 
              disabled={!previewImage || isAnalyzing}
              className="h-12 px-8 rounded-full bg-sky-500 text-white text-xs font-black uppercase tracking-widest hover:bg-sky-400 disabled:opacity-30 disabled:hover:bg-sky-500 transition-all shadow-lg shadow-sky-500/20"
            >
              {isAnalyzing ? 'Processing...' : 'Run Neural Bridge'}
            </button>
          </div>

          <div className="relative aspect-[4/3] rounded-[32px] border border-white/10 bg-black/40 overflow-hidden group">
            {previewImage ? (
              <>
                <img src={previewImage} alt="Input" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <AnimatePresence>
                  {activeXai !== 'none' && result.explanations[activeXai] && (
                    <motion.img
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      src={`data:image/jpeg;base64,${result.explanations[activeXai]}`}
                      className={`absolute inset-0 h-full w-full object-cover pointer-events-none ${activeXai === 'lime' ? '' : 'opacity-80 mix-blend-screen'}`}
                    />
                  )}
                </AnimatePresence>
                
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="h-16 w-16 rounded-full border-2 border-sky-500/20 border-t-sky-500"
                    />
                    <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-sky-400 animate-pulse">Running Neural Consensus...</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center flex-col text-slate-700 gap-4">
                 <ScanSearch size={48} className="opacity-10" />
                 <p className="text-xs font-black uppercase tracking-widest opacity-20">Input Required</p>
              </div>
            )}
          </div>

          {result.explanations.gradcam && (
            <div className="mt-8 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {['none', 'gradcam', 'lime', 'shap', 'consensus'].map((id) => (
                <button
                  key={id}
                  onClick={() => setActiveXai(id)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    activeXai === id 
                    ? 'bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/20' 
                    : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {id === 'none' ? 'Clean Input' : id === 'consensus' ? '🎯 Consensus' : id}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Right Column: Results & Interpretation */}
      <div className="lg:col-span-2 space-y-10">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="premium-glass p-10 rounded-[48px] border border-white/5"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-white tracking-tight">Inference</h3>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
               <Activity size={20} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">DR Grade</p>
                <p className="text-5xl font-black text-white tracking-tighter mt-2">{result.grade}</p>
             </div>
             <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confidence</p>
                <p className="text-5xl font-black text-sky-400 tracking-tighter mt-2">{result.confidence}%</p>
             </div>
          </div>

          <div className="mt-8 p-6 rounded-3xl bg-white/5 border border-white/5">
             <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">XAI Agreement</span>
                <span className="text-xs font-black text-emerald-400">{(result.interpretation.agreement_score * 100).toFixed(1)}%</span>
             </div>
             <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${result.interpretation.agreement_score * 100}%` }}
                  className="h-full bg-emerald-500"
                />
             </div>
          </div>

          <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
             <AlertCircle size={16} className={result.risk === 'Critical' ? 'text-rose-400' : 'text-emerald-400'} />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Status: {result.risk} Risk</span>
          </div>
        </motion.div>

        {result.interpretation.summary && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-glass p-8 rounded-[48px] border border-white/5"
          >
            <div className="flex p-1 rounded-2xl bg-black/20 border border-white/5 mb-8">
               {['patient', 'expert'].map(tab => (
                 <button
                   key={tab}
                   onClick={() => setReportTab(tab)}
                   className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                     reportTab === tab ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:text-white'
                   }`}
                 >
                   {tab === 'patient' ? 'Patient Summary' : 'Expert Audit'}
                 </button>
               ))}
            </div>

            <AnimatePresence mode="wait">
              {reportTab === 'patient' ? (
                <motion.div 
                  key="patient"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <div className="p-6 rounded-3xl bg-sky-500/5 border border-sky-500/10">
                    <p className="text-sm leading-relaxed text-slate-200 font-medium">
                      {result.interpretation.patient_report}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/40 border border-white/5">
                     <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-sky-400">
                        <CheckCircle2 size={18} />
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action Plan Verified</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="expert"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="grid gap-3"
                >
                  {(result.interpretation.clinical_audit || "").split('\n').filter(l => l.includes(':')).map((line, i) => {
                    const [k, v] = line.split(':')
                    return (
                      <div key={i} className="flex flex-col gap-1 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{k.trim().replace(/^[*-]\s*/, '')}</span>
                        <span className="text-xs font-mono text-slate-300">{v.trim()}</span>
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default UploadAnalyzePage
