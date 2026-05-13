import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScanSearch, Upload, Activity, ShieldCheck, Zap, ArrowUpRight, CheckCircle2, AlertCircle, Download, Eye, FileText, ClipboardCheck, Printer, FileType } from 'lucide-react'

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

  const printToPDF = () => {
    const printWindow = window.open('', '_blank');
    const auditHtml = (result.interpretation.clinical_audit || "").split('\n').map(line => `<li>${line}</li>`).join('');

    const html = `
      <html>
        <head>
          <title>RetinaCare Clinical Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 40px; }
            .logo { font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -1px; }
            .logo span { color: #0ea5e9; }
            .badge { display: inline-block; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
            .badge-risk { background: ${result.risk === 'Critical' ? '#fee2e2' : result.risk === 'High' ? '#ffedd5' : '#ecfdf5'}; color: ${result.risk === 'Critical' ? '#991b1b' : result.risk === 'High' ? '#9a3412' : '#065f46'}; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-bottom: 10px; border-left: 3px solid #0ea5e9; padding-left: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .card { background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; }
            .value { font-size: 24px; font-weight: 900; color: #0f172a; }
            .patient-note { background: #f0f9ff; padding: 25px; border-radius: 20px; border: 1px solid #bae6fd; font-style: italic; color: #0369a1; }
            .footer { margin-top: 60px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">RetinaCare<span>.</span></div>
            <div class="badge badge-risk">${result.risk} Risk Status</div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="section-title">Predicted Severity</div>
              <div class="value">Grade ${result.grade}</div>
              <div style="font-size: 12px; font-weight: 700; color: #0ea5e9; margin-top: 5px;">Model Confidence: ${result.confidence}%</div>
            </div>
            <div class="card">
              <div class="section-title">XAI Agreement</div>
              <div class="value">${(result.interpretation.agreement_score * 100).toFixed(1)}%</div>
              <div style="font-size: 12px; font-weight: 700; color: #6366f1; margin-top: 5px;">Consensus Match</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Clinical Audit Log</div>
            <div class="card" style="font-family: monospace; font-size: 11px;">
              <ul style="list-style: none; padding: 0;">${auditHtml}</ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Patient Narrative</div>
            <div class="patient-note">
              ${result.interpretation.patient_report?.replace(/\n/g, '<br>') || 'Awaiting interpretation...'}
            </div>
          </div>

          <div class="footer">
            RetinaCare AI Diagnostic Suite • Confidential Medical Document • ${new Date().toLocaleString()}
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
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

  const renderExpertAudit = () => {
    const auditText = result.interpretation.clinical_audit || ""
    const lines = auditText.split('\n').filter(l => l.includes(':'))

    if (lines.length === 0) {
      return (
        <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
          <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
            {formatText(auditText) || "Generating technical audit parameters..."}
          </p>
        </div>
      )
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lines.map((line, i) => {
          const parts = line.split(':')
          const k = parts[0]
          const v = parts.slice(1).join(':')
          return (
            <div key={i} className="flex flex-col gap-2 p-5 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 hover:border-indigo-500/30 transition-all group">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-500/10 pb-2 mb-1 group-hover:text-indigo-300 transition-colors">
                {k.trim().replace(/^[*-]\s*/, '')}
              </span>
              <span className="text-sm font-mono text-slate-200 font-bold leading-tight">
                {formatText(v.trim())}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-10 lg:grid-cols-5">
        {/* Step 1: Source Intake */}
        <div className="lg:col-span-2 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-glass p-10 rounded-[48px] border border-white/5 h-full flex flex-col"
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
              className={`group relative flex-1 flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed p-8 text-center transition-all cursor-pointer overflow-hidden ${isDragging ? 'border-sky-500 bg-sky-500/10' : 'border-white/5 bg-black/20 hover:border-white/20'
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
        </div>

        {/* Step 2: XAI Projection & Inference */}
        <div className="lg:col-span-3 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="premium-glass p-10 rounded-[48px] border border-white/5"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">XAI Projection</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Step 02: Neural Overlay</p>
              </div>

              <div className="flex flex-wrap items-center gap-4 md:gap-8">
                {/* FIXED: Single line formatting for Grade and Confidence */}
                <div className="flex items-center gap-4 px-6 border-r border-white/10">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Grade:</span>
                    <span className="text-2xl font-black text-white leading-none">0{result.grade}</span>
                  </div>
                  <div className="flex items-center gap-2 whitespace-nowrap ml-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confidence:</span>
                    <span className="text-2xl font-black text-sky-400 leading-none">{result.confidence}%</span>
                  </div>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={!previewImage || isAnalyzing}
                  className="h-12 px-10 rounded-2xl bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-sky-400 disabled:opacity-30 disabled:hover:bg-sky-500 transition-all shadow-xl shadow-sky-500/20 active:scale-95 whitespace-nowrap"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyse'}
                </button>
              </div>
            </div>

            <div className="relative h-[500px] w-full rounded-[32px] border border-white/10 bg-black/80 overflow-hidden group flex items-center justify-center">
              {previewImage ? (
                <>
                  <img
                    src={previewImage}
                    alt="Input"
                    className="h-full w-full object-contain transition-transform duration-700"
                  />
                  <AnimatePresence>
                    {activeXai !== 'none' && result.explanations[activeXai] && (
                      <motion.img
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        src={`data:image/jpeg;base64,${result.explanations[activeXai]}`}
                        className={`absolute inset-0 h-full w-full object-contain pointer-events-none ${activeXai === 'lime' ? '' : 'opacity-80 mix-blend-screen'}`}
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
                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeXai === id
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
      </div>

      {/* Step 3: Interpretation & Report */}
      <AnimatePresence>
        {result.interpretation.summary && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-glass p-10 rounded-[48px] border border-white/5"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Clinical Interpretation</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Multi-Modal Consensus Report</p>
              </div>

              <div className="flex p-1 rounded-2xl bg-black/20 border border-white/5 min-w-[320px]">
                {['patient', 'expert'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setReportTab(tab)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportTab === tab ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:text-white'
                      }`}
                  >
                    {tab === 'patient' ? 'Patient Summary' : 'Expert Audit'}
                  </button>
                ))}
              </div>

              <button
                onClick={printToPDF}
                className="h-14 px-8 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-sky-400 hover:text-white transition-all flex items-center gap-3 group"
              >
                <Printer size={18} className="group-hover:scale-110 transition-transform" />
                Generate PDF Report
              </button>
            </div>

            <AnimatePresence mode="wait">
              {reportTab === 'patient' ? (
                <motion.div
                  key="patient"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="p-10 rounded-[32px] bg-sky-500/5 border border-sky-500/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Zap size={120} className="text-sky-400" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <FileText size={20} className="text-sky-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">Personalized Insights</span>
                      </div>
                      <div className="text-lg leading-relaxed text-slate-200 font-medium whitespace-pre-wrap max-w-4xl">
                        {formatText(result.interpretation.patient_report)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="expert"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-10"
                >
                  <div className="p-10 rounded-[32px] bg-indigo-500/5 border border-indigo-500/10">
                    <div className="flex items-center gap-3 mb-10">
                      <ClipboardCheck size={20} className="text-indigo-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Clinical Verification Parameters</span>
                    </div>
                    {renderExpertAudit()}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Agreement</p>
                      <p className="text-xl font-black text-emerald-400">{(result.interpretation.agreement_score * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Risk Tier</p>
                      <p className="text-xl font-black text-white">{result.risk}</p>
                    </div>
                    <div className="col-span-2 p-6 rounded-3xl bg-white/5 border border-white/5">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Methods Synchronized</p>
                      <p className="text-sm font-bold text-sky-400 truncate">{result.interpretation.methods_available?.join(' • ') || 'None'}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UploadAnalyzePage
