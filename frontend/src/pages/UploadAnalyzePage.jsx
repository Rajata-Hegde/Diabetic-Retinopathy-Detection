import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Shield, Activity, FileText, Zap, ChevronRight, Hash, Printer, Download, Sparkles, BrainCircuit, Globe, RefreshCcw, ArrowRight } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

function UploadAnalyzePage({ onAnalyze }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [activeXai, setActiveXai] = useState('original')
  const [analysisStage, setAnalysisStage] = useState('idle')

  const onDrop = useCallback(acceptedFiles => {
    const selectedFile = acceptedFiles[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  })

  const handleAnalyze = async () => {
    if (!file) return
    setAnalyzing(true)
    setAnalysisStage('decision')
    setResult(null)
    try {
      const data = await onAnalyze(file, (partial) => {
        setResult(partial)
        if (partial.status === 'decision_ready') setAnalysisStage('decision')
        if (partial.status === 'xai_processing' || partial.status === 'xai_ready') setAnalysisStage('xai')
        if (partial.status === 'vlm_processing') setAnalysisStage('vlm')
        if (partial.status === 'complete') setAnalysisStage('complete')
      })
      setResult(data)
      setAnalysisStage('complete')
    } catch (error) {
      console.error("Diagnostic failure:", error)
      setAnalysisStage('idle')
    } finally {
      setAnalyzing(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setActiveXai('original')
    setAnalysisStage('idle')
  }

  const stageMessage = {
    idle: 'Ready',
    decision: 'Decision ready. Generating explainability maps...',
    xai: 'XAI projections are being rendered...',
    vlm: 'Generating report...',
    complete: 'Scan finalized'
  }

  const isComplete = result?.status === 'complete' || analysisStage === 'complete'

  const getAnalyzedSuggestions = (data) => {
    if (data.suggestions && data.suggestions.length > 0) return data.suggestions;

    const grade = parseInt(data.grade);
    let advice = [];

    switch (grade) {
      case 0:
        advice = [
          "Maintain routine annual diabetic eye screening schedule.",
          "Continue optimal glycemic and blood pressure control.",
          "Educate patient on importance of regular eye checkups.",
          "No immediate ophthalmological referral required for DR."
        ];
        break;
      case 1:
        advice = [
          "Schedule follow-up diabetic eye screening in 12 months.",
          "Optimize metabolic control (HbA1c, BP, Lipids) to prevent progression.",
          "Refer to primary care for intensive risk factor management.",
          "Provide patient education on early retinopathy signs."
        ];
        break;
      case 2:
        advice = [
          "Refer to an ophthalmologist for a dilated fundus examination.",
          "Consider specialist follow-up within 6 months to monitor progression.",
          "Reinforce strict glycemic and blood pressure management.",
          "Discuss potential for progression and treatment options."
        ];
        break;
      case 3:
        advice = [
          "Urgent referral to a retina specialist (recommended within 4 weeks).",
          "Requires comprehensive eye exam and likely OCT imaging.",
          "High risk of progression to vision-threatening disease.",
          "Intensive systemic management of diabetes and hypertension."
        ];
        break;
      case 4:
        advice = [
          "Emergency referral to a retina specialist for immediate evaluation.",
          "Consider urgent intervention (Anti-VEGF, Laser, or Surgery).",
          "Extremely high risk of permanent vision loss if untreated.",
          "Immediate coordination with the patient's multi-disciplinary care team."
        ];
        break;
      default:
        advice = [
          "Refer to ophthalmology for specialist assessment.",
          "Schedule dilated fundus exam to confirm diagnostic findings.",
          "Document findings in EHR and notify primary care team."
        ];
    }

    if (data.confidence < 75) {
      advice.push("Correlate findings with clinical exam due to moderate model confidence.");
    }
    if (data.xai_agreement < 40) {
      advice.push("Obtain multimodal imaging (OCT/FA) due to inconsistent XAI consensus.");
    }

    return advice;
  };

  const printToPDF = () => {
    if (!result) return;
    const printWindow = window.open('', '_blank');

    const pdfFormat = (text) => {
      if (!text) return "";
      // remove explicit numeric scores or % from narrative
      let cleaned = text.replace(/\d{1,3}%/g, '').replace(/Model Confidence:.*$/gim, '').replace(/confidence[:\s]*\d{1,3}%?/gim, '').replace(/score[:\s]*\d{1,3}%?/gim, '');
      return cleaned.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>');
    };

    const auditHtml = (result.clinical_audit || "").split('\n').map(line => {
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
          <title>DiabEyetic Insight - Clinical Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #0f172a; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .brand { font-size: 20px; font-weight: 900; }
            .brand span { color: #0ea5e9; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .card { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 10px; }
            .value { font-size: 24px; font-weight: 900; color: #0f172a; }
            .evidence-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .evidence-img { width: 100%; aspect-ratio: 1; object-fit: contain; border-radius: 8px; background: #000; }
            .patient-note { font-style: italic; font-size: 14px; line-height: 1.6; color: #334155; background: #f0f9ff; padding: 20px; border-radius: 12px; border: 1px solid #bae6fd; }
            .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">DiabEyetic<span> Insight</span></div>
            <div style="text-align: right; font-size: 12px; font-weight: 700;">Diagnostic Ref: ${result.id || 'RC-' + Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="section-title">Predicted Severity</div>
              <div class="value">Grade ${result.grade}</div>
              <div style="font-size: 12px; font-weight: 700; color: #0ea5e9; margin-top: 5px;">Model Confidence: ${result.confidence}%</div>
            </div>
            <div class="card">
              <div class="section-title">XAI Agreement</div>
              <div class="value">${result.xai_agreement ?? 'N/A'}%</div>
              <div style="font-size: 12px; font-weight: 700; color: #6366f1; margin-top: 5px;">Consensus Match</div>
            </div>
          </div>
          <!-- Reliability gate intentionally removed from printed report (tool is preliminary diagnosis only) -->

          <div class="section">
            <div class="section-title">Clinical Audit Log</div>
            <div class="card" style="font-family: monospace; font-size: 11px;">
              <ul style="list-style: none; padding: 0;">${auditHtml}</ul>
            </div>
          </div>

          <div class="section" style="margin-top: 30px;">
            <div class="section-title">Visual Evidence</div>
            <div class="evidence-grid">
              <img class="evidence-img" src="data:image/jpeg;base64,${result.images?.original}"/>
              <img class="evidence-img" src="data:image/jpeg;base64,${result.images?.consensus}"/>
            </div>
          </div>

          <div class="section" style="margin-top: 30px;">
            <div class="section-title">Patient Narrative</div>
            <div class="patient-note">
              ${pdfFormat(result.patient_report || "")}
            </div>
          </div>

          <div class="section" style="margin-top: 20px;">
            <div class="section-title">Suggested Next Steps</div>
            <div class="card">
              <ul style="margin:0;padding-left:16px;">
                ${getAnalyzedSuggestions(result).map(s => `<li>${s}</li>`).join('')}
              </ul>
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
    // Clean redundant salutations, structural markers, and patient identifiers
    let cleanedText = text
      .replace(/Dear Patient,?\s?/gi, '')
      .replace(/Patient:\s?.*?\n/gi, '')
      .replace(/(Mr\.|Ms\.|Mrs\.)\s?.*?\s/gi, '')
      .replace(/Part\s?\d+:?\s?/gi, '')
      .replace(/Section\s?\d+:?\s?/gi, '');

    // Remove explicit numeric scores or percent mentions from the narrative
    cleanedText = cleanedText.replace(/\d{1,3}%/g, '');
    cleanedText = cleanedText.replace(/Model Confidence:.*$/gim, '');
    cleanedText = cleanedText.replace(/confidence[:\s]*\d{1,3}%?/gim, '');
    cleanedText = cleanedText.replace(/score[:\s]*\d{1,3}%?/gim, '');

    // Replace markdown bold with premium strong tags
    let formatted = cleanedText.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-black drop-shadow-sm">$1</strong>');

    // Highlight specific clinical terms
    const clinicalHighlights = {
      grade: /Grade\s[0-4]/gi,
      risk: /(Critical|High Risk|Moderate|Mild|No DR)/gi,
      medical: /(Retinopathy|Hemorrhages|Exudates|Microaneurysms|Macula|Optic Disc)/gi
    };

    formatted = formatted.replace(clinicalHighlights.grade, '<span class="text-sky-400 font-black tracking-tight">$1</span>');
    formatted = formatted.replace(clinicalHighlights.risk, '<span class="text-rose-400 font-black tracking-tight">$1</span>');
    formatted = formatted.replace(clinicalHighlights.medical, '<span class="text-indigo-300 font-bold">$1</span>');

    // Add subtle paragraph spacing
    formatted = formatted.split('\n').map(p => `<p class="mb-3 last:mb-0 leading-relaxed">${p}</p>`).join('');

    return (
      <div className="relative">
        <div className="absolute -left-6 top-0 bottom-0 w-[1px] bg-gradient-to-b from-sky-500/50 via-sky-500/10 to-transparent" />
        <div className="text-sm text-slate-300 font-medium" dangerouslySetInnerHTML={{ __html: formatted }} />
      </div>
    );
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
                <div {...getRootProps()} className={`relative min-h-[450px] rounded-[48px] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-6 overflow-hidden ${isDragActive ? 'border-sky-400 bg-sky-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}>
                  <input {...getInputProps()} />
                  {preview ? (
                    <img src={preview} className="max-h-full max-w-full object-contain rounded-2xl" />
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
                        'Neural Consensus (Grad-CAM,SHAP,LIME)',
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
                        {stageMessage[analysisStage] || 'Calibrating Neural Net...'}
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
                      <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">Sequence ID: {result.id || result.analysis_id}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-700" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{isComplete ? 'Scan Finalized' : (stageMessage[analysisStage] || 'Processing')}</span>
                    </div>
                  </div>
                </div>
                {/* Review gate intentionally removed from UI - tool is for preliminary diagnosis only */}
                <div className="flex gap-4">
                  <button
                    onClick={printToPDF}
                    disabled={!isComplete}
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
                  <div className="relative aspect-[4/3] rounded-[32px] bg-[#000000] border border-white/10 overflow-hidden shadow-2xl group/img flex items-center justify-center">
                    {result.images?.[activeXai] ? (
                      <img
                        src={`data:image/jpeg;base64,${result.images[activeXai]}`}
                        className="max-h-full max-w-full object-contain transition-transform duration-700"
                      />
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
                <div className="flex flex-col h-full space-y-8 min-h-[800px]">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-8 rounded-[40px] bg-white/5 border border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 text-sky-500/10">
                        <Activity size={60} />
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Severity Grade</p>
                      <h4 className={`font-black text-white tracking-tighter leading-none ${(result.grade_name || "").length > 10 ? 'text-3xl' : 'text-5xl'
                        }`}>
                        {result.grade_name || `Grade ${result.grade}`}
                      </h4>
                      <p className="text-[10px] font-bold text-sky-400 mt-2">Classified as {result.risk}</p>
                    </div>
                    <div className="p-8 rounded-[40px] bg-white/5 border border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 text-emerald-500/10">
                        <Globe size={60} />
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Model Confidence</p>
                      <div className="flex items-baseline gap-4">
                        <h4 className="text-5xl font-black text-white tracking-tighter">{(result.confidence ?? '--')}%</h4>
                      </div>
                      <p className="text-[10px] font-bold text-emerald-400 mt-2">VLM Alignment: {(result.vlm_alignment || 'pending').toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="p-10 rounded-[48px] bg-sky-500/5 border border-sky-500/10 backdrop-blur-3xl relative overflow-hidden flex-1 min-h-0 flex flex-col">
                    <div className="flex items-center gap-3 mb-6 shrink-0">
                      <Sparkles size={20} className="text-sky-400" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Clinical Audit Report</span>
                    </div>
                    <div className="premium-glass p-6 rounded-[32px] border border-white/10 bg-black/40 flex-1 overflow-y-auto custom-scrollbar">
                      <pre className="text-[13px] text-sky-200 leading-relaxed font-mono whitespace-pre-wrap break-words">
                        {result.patient_report || "Report being finalized..."}
                      </pre>
                    </div>
                  </div>

                  <div className="p-8 rounded-[40px] bg-white/5 border border-white/5 relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-4">
                      <Activity size={16} className="text-sky-400" />
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">Clinical Findings</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2 text-sm text-slate-300">
                      {result.clinical_audit ? (
                        result.clinical_audit.split('\n').map((line, i) => {
                          if (!line.trim()) return null;
                          const formatted = line
                            .replace(/^(.*?):/, '<strong class="text-sky-400">$1:</strong>')
                            .replace(/(Exudates|Hemorrhages|Microaneurysms|Neovascularization|Cotton wool spots|Macula|Optic Disc)/gi, '<span class="text-white font-bold">$1</span>');
                          return (
                            <div key={i} className="mb-2 last:mb-0 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
                          )
                        })
                      ) : (
                        <div className="text-sm text-slate-500">Clinical findings will appear after VLM completes.</div>
                      )}
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