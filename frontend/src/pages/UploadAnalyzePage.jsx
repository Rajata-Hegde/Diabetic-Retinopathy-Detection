import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Shield, Activity, FileText, Zap, ChevronRight, Hash, Printer, Download, Sparkles, BrainCircuit, Globe, RefreshCcw, ArrowRight } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

function UploadAnalyzePage({ onScanComplete }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [activeXai, setActiveXai] = useState('consensus')

  const onDrop = useCallback(acceptedFiles => {
    const selectedFile = acceptedFiles[0]
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {'image/*': []},
    multiple: false 
  })

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setAnalyzing(false)
  }

  const handleAnalyze = async () => {
    if (!file) return
    setAnalyzing(true)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      setResult(data)
      
      // Update global state
      if (onScanComplete) {
        onScanComplete({
          id: data.id,
          name: file.name.split('.')[0],
          lastScan: new Date().toISOString().split('T')[0],
          grade: data.grade,
          risk: data.risk,
          ...data
        })
      }
    } catch (err) {
      console.error("Analysis failed:", err)
    } finally {
      setAnalyzing(false)
    }
  }

  const printToPDF = () => {
    const printWindow = window.open('', '_blank');
    
    const pdfFormat = (text) => {
        if (!text) return "";
        return text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>');
    };

    const auditHtml = (result.interpretation.clinical_audit || "").split('\n').map(line => {
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
          <title>DiabEyetic Insight Clinical Report</title>
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
            <div class="logo">DiabEyetic<span> Insight.</span></div>
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
              ${pdfFormat(result.interpretation.patient_report)}
            </div>
          </div>

          <div class="footer">
            DiabEyetic Insight AI Diagnostic Suite • Confidential Medical Document • ${new Date().toLocaleString()}
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
    <div className="relative min-h-[85vh] rounded-[48px] overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
         <img 
          src="/assets/upload_bg.png" 
          className="h-full w-full object-cover opacity-40 scale-105 group-hover:scale-100 transition-transform duration-[10s]" 
          alt="Futuristic Background"
         />
         <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#020617]/80 to-[#020617]/40" />
      </div>

      <div className="relative z-10 p-12">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
               <div className="text-center mb-12">
                  <h2 className="text-5xl font-black text-white tracking-tighter mb-4">Neural Entry Point</h2>
                  <p className="text-lg text-slate-400 font-medium max-w-xl mx-auto">
                    Initiate a high-fidelity retinal analysis. Our multi-modal XAI ensemble will perform a deep-tissue audit of your fundus imaging.
                  </p>
               </div>

               <div className="grid gap-10 lg:grid-cols-2">
                 <div {...getRootProps()} className={`relative aspect-square rounded-[48px] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-12 overflow-hidden ${
                   isDragActive ? 'border-sky-400 bg-sky-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                 }`}>
                   <input {...getInputProps()} />
                   {preview ? (
                     <img src={preview} className="h-full w-full object-contain" />
                   ) : (
                     <>
                        <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center text-slate-500 mb-6">
                           <Upload size={40} />
                        </div>
                        <p className="text-sm font-black uppercase tracking-widest text-slate-400">Drop fundus image here</p>
                        <p className="mt-2 text-xs font-bold text-slate-600">Supported formats: JPEG, PNG</p>
                     </>
                   )}
                 </div>

                 <div className="flex flex-col justify-center space-y-6">
                    <div className="p-8 rounded-[40px] bg-white/5 border border-white/5 backdrop-blur-xl">
                       <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Shield size={16} className="text-sky-400" />
                          Diagnostic Protocols
                       </h3>
                       <ul className="space-y-4">
                          {[
                            'Real-time Severity Classification',
                            'Neural Consensus (Grad-CAM/SHAP)',
                            'Automated Clinical Audit Log',
                            'End-to-End Cloud Archival'
                          ].map((text, i) => (
                            <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-400">
                               <div className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                               {text}
                            </li>
                          ))}
                       </ul>
                    </div>

                    <button
                      onClick={handleAnalyze}
                      disabled={!file || analyzing}
                      className="h-20 w-full rounded-[32px] bg-sky-500 text-white font-black text-lg tracking-tight hover:bg-sky-400 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-4 shadow-xl shadow-sky-500/20"
                    >
                      {analyzing ? (
                        <>
                          <RefreshCcw size={24} className="animate-spin" />
                          Calibrating Neural Net...
                        </>
                      ) : (
                        <>
                          Run Diagnostic Audit
                          <ArrowRight size={24} />
                        </>
                      )}
                    </button>
                 </div>
               </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-6xl mx-auto space-y-10"
            >
               {/* Analysis Header */}
               <div className="flex items-center justify-between premium-glass p-8 rounded-[40px] border border-white/10">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-3xl bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                      <Zap size={32} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white tracking-tight">Diagnostic Verdict</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">Sequence ID: {result.id}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-700" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Scan Finalized</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                     <button 
                      onClick={printToPDF}
                      className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 flex items-center gap-2"
                     >
                        <Printer size={16} />
                        PDF Report
                     </button>
                     <button onClick={reset} className="h-14 px-8 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-sky-400 hover:text-white transition-all">
                        Reset Terminal
                     </button>
                  </div>
               </div>

               <div className="grid gap-10 lg:grid-cols-2">
                 {/* Visual Evidence */}
                 <div className="space-y-6">
                   <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Forensic Neural Mapping</h4>
                     <div className="flex gap-2 p-1 rounded-2xl bg-white/5 border border-white/5">
                        {['original', 'gradcam', 'lime', 'shap', 'consensus'].map(id => (
                          <button
                            key={id}
                            onClick={() => setActiveXai(id)}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeXai === id ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                          >
                            {id}
                          </button>
                        ))}
                     </div>
                   </div>
                   <div className="relative aspect-square rounded-[54px] bg-black border border-white/10 overflow-hidden shadow-2xl">
                      {result.explanations?.[activeXai] ? (
                        <img src={`data:image/jpeg;base64,${result.explanations[activeXai]}`} className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex flex-col h-full items-center justify-center gap-4">
                           <RefreshCcw size={32} className="text-slate-800 animate-spin" />
                           <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Rendering Projection...</p>
                        </div>
                      )}
                      <div className="absolute top-8 left-8 flex items-center gap-3 px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10">
                         <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                         <span className="text-[9px] font-black text-white uppercase tracking-widest">{activeXai} Layer</span>
                      </div>
                   </div>
                 </div>

                 {/* Report Content */}
                 <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="p-8 rounded-[40px] bg-white/5 border border-white/5 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 text-sky-500/10">
                             <Activity size={60} />
                          </div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Severity Grade</p>
                          <h4 className="text-5xl font-black text-white tracking-tighter">{result.grade}</h4>
                          <p className="text-[10px] font-bold text-sky-400 mt-2">Classified as {result.risk}</p>
                       </div>
                       <div className="p-8 rounded-[40px] bg-white/5 border border-white/5 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 text-emerald-500/10">
                             <Globe size={60} />
                          </div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">System Accuracy</p>
                          <h4 className="text-5xl font-black text-white tracking-tighter">{result.confidence}%</h4>
                          <p className="text-[10px] font-bold text-emerald-400 mt-2">Model Confidence</p>
                       </div>
                    </div>

                    <div className="p-10 rounded-[48px] bg-sky-500/5 border border-sky-500/10 backdrop-blur-3xl relative overflow-hidden">
                       <div className="flex items-center gap-3 mb-6">
                          <Sparkles size={20} className="text-sky-400" />
                          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Automated Clinical Narrative</span>
                       </div>
                       <div className="text-lg text-slate-300 leading-relaxed font-medium space-y-4">
                          {formatText(result.interpretation.patient_report)}
                       </div>
                    </div>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default UploadAnalyzePage
