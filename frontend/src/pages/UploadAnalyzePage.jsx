import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ScanSearch, Upload } from 'lucide-react'
import { Badge, Button, Card } from '../components/SharedUI'
import { gradeLabels, pageTransition } from '../data/mockData'

function RiskBadge({ risk }) {
  const tone = { Low: 'green', Medium: 'yellow', High: 'orange', Critical: 'red' }[risk] || 'slate'
  return <Badge label={risk} tone={tone} />
}

function UploadAnalyzePage() {
  const [previewImage, setPreviewImage] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeXai, setActiveXai] = useState('none') // 'none', 'gradcam', 'lime', 'shap'
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
  const [reportTab, setReportTab] = useState('patient') // 'patient' or 'expert'
  const [error, setError] = useState(null)

  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage)
      }
    }
  }, [previewImage])

  const uploadFile = (file) => {
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) return

    if (previewImage) {
      URL.revokeObjectURL(previewImage)
    }

    setPreviewImage(URL.createObjectURL(file))
    setSelectedFile(file)
    setError(null)
  }

  const queryModel = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(
      'http://localhost:8000/analyze',
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`
      try {
        const errData = await response.json()
        errorMessage = errData.detail || errorMessage
      } catch (e) {
        const text = await response.text().catch(() => '')
        console.error('Non-JSON error response:', text)
      }
      throw new Error(errorMessage)
    }

    return await response.json()
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return
    setIsAnalyzing(true)
    setError(null)

    try {
      const inferenceResult = await queryModel(selectedFile)

      if (inferenceResult && typeof inferenceResult.grade === 'number') {
        const { grade, confidence, explanations, interpretation } = inferenceResult
        const risk = grade >= 4 ? 'Critical' : grade >= 3 ? 'High' : grade >= 2 ? 'Medium' : 'Low'

        setResult({ grade, confidence, risk, explanations, interpretation })
        setActiveXai('gradcam') // Default to Grad-CAM after analysis
      } else {
        throw new Error('Invalid response from local server.')
      }
    } catch (err) {
      console.error('Analysis failed:', err)
      setError(err.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <motion.div {...pageTransition} className="grid gap-5 xl:grid-cols-5">
      <div className="space-y-5 xl:col-span-3">
        <Card className="bg-slate-900">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Step 01</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Upload retinal fundus image</h3>
          </div>
          <label
            className={`block rounded-[28px] border-2 border-dashed p-8 text-center transition cursor-pointer ${isDragging ? 'border-sky-400 bg-sky-500/10' : 'border-slate-700 bg-slate-950 hover:border-slate-600'
              }`}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setIsDragging(false)
              uploadFile(event.dataTransfer.files?.[0])
            }}
          >
            <Upload className="mx-auto mb-3 text-sky-300" size={28} />
            <p className="text-lg font-semibold text-white">Drag and drop JPG/PNG here</p>
            <p className="mb-3 mt-1 text-sm text-slate-400">or click to browse files from your device</p>
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(event) => uploadFile(event.target.files?.[0])}
            />
          </label>
        </Card>

        <Card className="bg-slate-900 text-white">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Step 02</p>
              <h3 className="mt-1 text-2xl font-bold text-white">Image preview & XAI Overlay</h3>
            </div>
            <Button onClick={handleAnalyze} disabled={!previewImage || isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-slate-700 bg-slate-950">
            {previewImage ? (
              <>
                <img src={previewImage} alt="Retinal fundus preview" className="h-96 w-full object-cover" />
                {activeXai !== 'none' && result.explanations[activeXai] && (
                  <img
                    src={`data:image/jpeg;base64,${result.explanations[activeXai]}`}
                    alt={`${activeXai} Explanation`}
                    className={`absolute inset-0 h-96 w-full object-cover ${activeXai === 'lime' ? '' : 'opacity-70 mix-blend-screen'}`}
                  />
                )}
              </>
            ) : (
              <div className="flex h-96 items-center justify-center text-slate-500">No image selected</div>
            )}
          </div>

          {result.explanations.gradcam && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {[
                { id: 'none', label: 'Original' },
                { id: 'gradcam', label: 'Grad-CAM' },
                { id: 'lime', label: 'LIME' },
                { id: 'shap', label: 'SHAP' },
                { id: 'consensus', label: '🎯 Consensus' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveXai(tab.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition ${activeXai === tab.id ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="space-y-5 bg-slate-900 xl:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Step 03</p>
            <h3 className="mt-1 text-2xl font-bold text-white">Inference results</h3>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-500/10 text-sky-300">
            <ScanSearch size={20} />
          </span>
        </div>

        <div className="rounded-[24px] border border-slate-700 bg-slate-950 p-5">
          <p className="text-sm text-slate-400">Predicted DR grade</p>
          <p className="mt-1 text-4xl font-bold text-white">{result.grade}</p>
          <p className="mt-2 text-sm text-sky-300 font-semibold">{gradeLabels[result.grade]}</p>
        </div>

        <div className="rounded-[24px] border border-slate-700 bg-slate-950 p-5">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
            <span>Confidence Score</span>
            <span className="font-mono text-sky-400 font-bold">{result.confidence}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.confidence}%` }}
              className="h-full rounded-full bg-gradient-to-r from-sky-600 to-sky-400"
            />
          </div>
        </div>

        {result.interpretation?.summary && (
          <div className="rounded-[24px] border border-emerald-500/30 bg-emerald-500/5 p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">XAI Agreement Score</p>
              <span className="text-lg font-bold text-emerald-400 font-mono">{(result.interpretation.agreement_score * 100).toFixed(1)}%</span>
            </div>
            <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.interpretation.agreement_score * 100}%` }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
              />
            </div>
            {result.interpretation.methods_available?.length > 0 && (
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                Methods Used: <span className="text-emerald-300">{result.interpretation.methods_available.join(", ")}</span>
              </p>
            )}
          </div>
        )}

        {result.interpretation?.summary && (
          <div className="space-y-4">
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-700/50">
              <button
                onClick={() => setReportTab('patient')}
                className={`flex-1 rounded-lg py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${reportTab === 'patient'
                  ? 'bg-sky-500 text-white shadow-xl shadow-sky-500/20'
                  : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                Patient Report
              </button>
              <button
                onClick={() => setReportTab('expert')}
                className={`flex-1 rounded-lg py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${reportTab === 'expert'
                  ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                Expert Audit
              </button>
            </div>

            {reportTab === 'patient' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-[24px] border border-sky-500/20 bg-sky-500/5 p-6 shadow-2xl shadow-sky-500/5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 shadow-inner">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-400">Patient Diagnostic Narrative</h4>
                </div>

                <div className="space-y-4">
                  {result.interpretation.patient_report ? (
                    result.interpretation.patient_report.split('\n\n').map((para, i) => (
                      <p key={i} className="text-sm leading-relaxed text-slate-200 font-medium">
                        {para.startsWith('1.') || para.startsWith('2.') || para.startsWith('3.') || para.startsWith('4.')
                          ? <span className="block p-3 rounded-xl bg-sky-500/10 border border-sky-500/10 mt-2">{para}</span>
                          : para
                        }
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 italic">Generating specific patient insights...</p>
                  )}
                </div>

                <div className="mt-8 flex items-center gap-3 p-4 rounded-2xl bg-slate-950/80 border border-sky-500/20">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-sky-400 font-black uppercase tracking-widest">Next Step</p>
                    <p className="text-[11px] text-slate-300">Discuss the "bruising analogies" and "visual focus areas" mentioned above with your ophthalmologist.</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-[24px] border border-indigo-500/20 bg-indigo-500/5 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400">Structured Clinical Audit</h4>
                </div>

                <div className="grid gap-3">
                  {(result.interpretation.clinical_audit || result.interpretation.summary || "").split('\n').filter(line => line.includes(':')).map((line, i) => {
                    const [key, ...valParts] = line.split(':');
                    const val = valParts.join(':').trim();
                    return (
                      <div key={i} className="flex flex-col gap-1 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest opacity-70">{key.trim().replace(/^[*-]\s*/, '')}</span>
                        <span className="text-xs text-slate-200 font-mono">{val}</span>
                      </div>
                    );
                  })}
                  {!result.interpretation.clinical_audit && (
                    <div className="text-[11px] text-slate-500 italic p-4 border-l-2 border-slate-800">
                      Standard technical summary: {result.interpretation.summary}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}

        <div className="rounded-[24px] border border-slate-700 bg-slate-950 p-4">
          <p className="mb-2 text-sm text-slate-400">Risk classification</p>
          <RiskBadge risk={result.risk} />
        </div>

        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-sky-400"
          >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-r-transparent" />
            Generating Multi-Modal XAI Consensus Report...
          </motion.div>
        )}

        {error && (
          <div className="rounded-[24px] border border-rose-500/50 bg-rose-500/10 p-4 text-xs text-rose-300">
            <p className="font-semibold uppercase tracking-wider text-rose-400">Error</p>
            <p className="mt-1">{error}</p>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

export default UploadAnalyzePage
