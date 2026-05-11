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
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [result, setResult] = useState({ grade: 0, confidence: 0, risk: 'Low', heatmap: null })
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
    const rawToken = import.meta.env.VITE_HF_TOKEN
    const token = rawToken?.trim()
    
    if (!token) {
      console.error('HF Token is missing or empty')
      throw new Error('Hugging Face token not found. Please add VITE_HF_TOKEN to your .env file and RESTART your dev server.')
    }

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
        errorMessage = errData.error || errorMessage
        
        // Handle the "Model is loading" case specifically
        if (response.status === 503 && errData.estimated_time) {
          errorMessage = `Model is currently loading. Please try again in about ${Math.round(errData.estimated_time)} seconds.`
        }
      } catch (e) {
        // If not JSON, try to get the text body (could be a Vite 404 page)
        const text = await response.text().catch(() => '')
        console.error('Non-JSON error response:', text)
        if (response.status === 404) {
          errorMessage = 'Endpoint not found (404). Please ensure the proxy in vite.config.js is working and the model name is correct.'
        }
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
      
      // Our local backend returns { grade, confidence, probabilities } directly
      if (inferenceResult && typeof inferenceResult.grade === 'number') {
        const { grade, confidence, heatmap } = inferenceResult
        const risk = grade >= 4 ? 'Critical' : grade >= 3 ? 'High' : grade >= 2 ? 'Medium' : 'Low'

        setResult({ grade, confidence, risk, heatmap })
      } else {
        throw new Error('Invalid response from local server. Expected grade and confidence.')
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
            className={`block rounded-[28px] border-2 border-dashed p-8 text-center transition ${
              isDragging ? 'border-sky-400 bg-sky-500/10' : 'border-slate-700 bg-slate-950'
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
              <h3 className="mt-1 text-2xl font-bold text-white">Image preview</h3>
            </div>
            <Button onClick={handleAnalyze} disabled={!previewImage || isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-slate-700 bg-slate-950">
            {previewImage ? (
              <>
                <img src={previewImage} alt="Retinal fundus preview" className="h-96 w-full object-cover" />
                {showHeatmap && result.heatmap && (
                  <img 
                    src={`data:image/jpeg;base64,${result.heatmap}`} 
                    alt="Grad-CAM Heatmap" 
                    className="absolute inset-0 h-96 w-full object-cover opacity-70 mix-blend-screen"
                  />
                )}
                {showHeatmap && !result.heatmap && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/60 text-xs text-sky-300">
                    No heatmap available for this scan
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-96 items-center justify-center text-slate-500">No image selected</div>
            )}
          </div>
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
          <p className="mt-2 text-sm text-sky-300">{gradeLabels[result.grade]}</p>
        </div>

        <div className="rounded-[24px] border border-slate-700 bg-slate-950 p-5">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
            <span>Confidence Score</span>
            <span>{result.confidence}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${result.confidence}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[24px] border border-slate-700 bg-slate-950 p-4">
          <div>
            <p className="text-sm font-semibold text-white">Grad-CAM heatmap</p>
            <p className="text-xs text-slate-400">Overlay the model attention view on the image preview</p>
          </div>
          <button
            type="button"
            className={`h-7 w-12 rounded-full p-1 transition ${showHeatmap ? 'bg-sky-500' : 'bg-slate-700'}`}
            onClick={() => setShowHeatmap((prev) => !prev)}
          >
            <span className={`block h-5 w-5 rounded-full bg-white transition ${showHeatmap ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <div className="rounded-[24px] border border-slate-700 bg-slate-950 p-4">
          <p className="mb-2 text-sm text-slate-400">Risk classification</p>
          <RiskBadge risk={result.risk} />
        </div>

        {isAnalyzing && (
          <div className="flex items-center gap-2 text-sm text-sky-300">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-300 border-r-transparent" />
            Running model inference...
          </div>
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
