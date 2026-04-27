import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload } from 'lucide-react'
import { gradeLabels, pageTransition } from '../data/mockData'

function Card({ children, className = '' }) {
  return <section className={`rounded-2xl border border-slate-700/70 bg-slate-900/75 p-4 shadow-card ${className}`}>{children}</section>
}

function Button({ children, className = '', variant = 'primary', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60'
  const variants = {
    primary: 'bg-blue-500 text-slate-950 hover:bg-blue-400',
    ghost: 'border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800',
  }
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>
}

function RiskBadge({ risk }) {
  const tone = { Low: 'green', Medium: 'yellow', High: 'orange', Critical: 'red' }[risk] || 'slate'
  const tones = {
    slate: 'bg-slate-800 text-slate-100 border-slate-700',
    green: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    yellow: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    orange: 'bg-orange-500/20 text-orange-300 border-orange-400/40',
    red: 'bg-red-500/20 text-red-300 border-red-400/40',
  }
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{risk}</span>
}

function UploadAnalyzePage() {
  const [previewImage, setPreviewImage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [result, setResult] = useState({ grade: 2, confidence: 86, risk: 'Medium' })

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
  }

  const handleAnalyze = () => {
    if (!previewImage) return
    setIsAnalyzing(true)

    setTimeout(() => {
      const grade = Math.floor(Math.random() * 5)
      const confidence = Math.floor(Math.random() * 16) + 82
      const risk = grade >= 4 ? 'Critical' : grade >= 3 ? 'High' : grade >= 2 ? 'Medium' : 'Low'
      setResult({ grade, confidence, risk })
      setIsAnalyzing(false)
    }, 1600)
  }

  return (
    <motion.div {...pageTransition} className="grid gap-5 xl:grid-cols-5">
      <div className="space-y-5 xl:col-span-3">
        <Card>
          <h3 className="mb-3 text-lg font-semibold text-slate-50">Upload Retinal Fundus Image</h3>
          <label
            className={`block rounded-xl border-2 border-dashed p-6 text-center transition ${isDragging ? 'border-blue-400 bg-blue-500/10' : 'border-slate-700 bg-slate-900/60'}`}
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
            <Upload className="mx-auto mb-3 text-blue-300" size={28} />
            <p className="text-slate-100">Drag and drop JPG/PNG here</p>
            <p className="mb-3 mt-1 text-xs text-slate-400">or click to browse files</p>
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(event) => uploadFile(event.target.files?.[0])}
            />
          </label>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-50">Image Preview</h3>
            <Button onClick={handleAnalyze} disabled={!previewImage || isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
            {previewImage ? (
              <>
                <img src={previewImage} alt="Retinal fundus preview" className="h-96 w-full object-cover" />
                {showHeatmap && (
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_65%_45%,rgba(239,68,68,0.52),transparent_44%),radial-gradient(circle_at_38%_58%,rgba(59,130,246,0.45),transparent_36%)]" />
                )}
              </>
            ) : (
              <div className="flex h-96 items-center justify-center text-slate-500">No image selected</div>
            )}
          </div>
        </Card>
      </div>

      <Card className="space-y-4 xl:col-span-2">
        <h3 className="text-lg font-semibold text-slate-50">Inference Results</h3>
        <div>
          <p className="text-sm text-slate-400">Predicted DR Grade</p>
          <p className="text-3xl font-bold text-slate-100">{result.grade}</p>
          <p className="text-sm text-blue-300">{gradeLabels[result.grade]}</p>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
            <span>Confidence Score</span>
            <span>{result.confidence}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-700">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${result.confidence}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/40 p-3">
          <div>
            <p className="text-sm font-semibold text-slate-100">Grad-CAM Heatmap</p>
            <p className="text-xs text-slate-400">Visual attention overlay placeholder</p>
          </div>
          <button
            type="button"
            className={`h-7 w-12 rounded-full p-1 transition ${showHeatmap ? 'bg-blue-500' : 'bg-slate-700'}`}
            onClick={() => setShowHeatmap((prev) => !prev)}
          >
            <span className={`block h-5 w-5 rounded-full bg-white transition ${showHeatmap ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
          <p className="mb-2 text-sm text-slate-400">Risk Classification</p>
          <RiskBadge risk={result.risk} />
        </div>

        {isAnalyzing && (
          <div className="flex items-center gap-2 text-sm text-blue-300">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-r-transparent" />
            Running model inference...
          </div>
        )}
      </Card>
    </motion.div>
  )
}

export default UploadAnalyzePage
