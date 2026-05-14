import { useMemo, useState, useEffect } from 'react'
import { Bell, Search, UserRound, LayoutDashboard, UploadCloud, BarChart3, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { navItems } from './data/mockData'
import HomePage from './pages/HomePage'
import DashboardHome from './pages/DashboardHome'
import UploadAnalyzePage from './pages/UploadAnalyzePage'
import PatientRecordsPage from './pages/PatientRecordsPage'
// import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import Chatbot from './components/Chatbot'
import './App.css'

function App() {
  const [activePage, setActivePage] = useState('home')
  const [searchTerm, setSearchTerm] = useState('')
  const [patientRecords, setPatientRecords] = useState([])
  const [appStats, setAppStats] = useState([
    { title: 'Scans Today', value: '0', icon: UploadCloud },
    { title: 'High Risk Cases', value: '0', icon: Bell },
    // { title: 'Accuracy', value: '93.1%', icon: BarChart3 },
  ])

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:8000/records')
        if (response.ok) {
          const data = await response.json()
          // Map backend fields to frontend record format
          const formatted = data.map(r => ({
            id: r._id,
            name: r.filename.split('.')[0] || 'Anonymous',
            lastScan: r.timestamp.split('T')[0],
            grade: r.grade,
            risk: r.grade >= 3 ? 'Critical' : r.grade >= 2 ? 'Medium' : 'Low',
            ...r
          }))
          setPatientRecords(formatted)
        }
      } catch (err) {
        console.error("Failed to sync with Diagnostic Vault:", err)
        // Fallback to local if backend is unreachable
        const saved = localStorage.getItem('retina_records')
        if (saved) setPatientRecords(JSON.parse(saved))
      }
    }
    fetchHistory()
  }, [])

  useEffect(() => {
    localStorage.setItem('retina_records', JSON.stringify(patientRecords))
    const today = new Date().toLocaleDateString()
    const todayScans = patientRecords.filter(r => r.lastScan === today).length
    const urgentCases = patientRecords.filter(r => r.risk === 'Critical' || r.risk === 'High').length

    setAppStats([
      { title: 'Scans Today', value: todayScans.toString(), icon: UploadCloud },
      { title: 'High Risk Cases', value: urgentCases.toString(), icon: Bell },
      // { title: 'Accuracy', value: '93.1%', icon: BarChart3 },
    ])
  }, [patientRecords])

  const pageTitle = navItems.find((item) => item.key === activePage)?.label ?? 'Dashboard'

  const quickStats = [
    { label: 'Live Activity', value: `${appStats[0].value} scans` },
    { label: 'Priority', value: `${appStats[1].value} cases` },
    { label: 'System HP', value: 'Stable' },
  ]

  const searchedRecords = useMemo(() => {
    return patientRecords.filter((item) =>
      `${item.id} ${item.name}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm, patientRecords])

  const addPatientRecord = (newRecord) => {
    setPatientRecords(prev => [newRecord, ...prev])
  }

  const formatDiagnosticPayload = (data, file) => ({
    id: data._id || data.analysis_id || 'RC-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    analysis_id: data.analysis_id,
    status: data.status,
    name: file.name.split('.')[0],
    lastScan: new Date().toLocaleDateString(),
    ...data,
    risk: data.grade >= 3 ? 'Critical' : data.grade >= 2 ? 'Medium' : 'Low'
  })

  const handleDiagnosticAnalysis = async (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('http://localhost:8000/analyze/start', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) throw new Error('Neural analysis failed')

    const startData = await response.json()
    let latest = formatDiagnosticPayload(startData, file)
    onProgress?.(latest)

    while (latest.status !== 'complete' && latest.status !== 'error') {
      await new Promise((resolve) => setTimeout(resolve, 1200))
      const statusResponse = await fetch(`http://localhost:8000/analyze/status/${latest.analysis_id}`)
      if (!statusResponse.ok) {
        throw new Error('Analysis status sync failed')
      }
      const statusData = await statusResponse.json()
      latest = formatDiagnosticPayload(statusData, file)
      onProgress?.(latest)
    }

    if (latest.status === 'error') {
      throw new Error(latest.error || 'Staged analysis failed')
    }

    addPatientRecord(latest)
    return latest
  }

  const handleDeleteRecord = async (recordId) => {
    try {
      const response = await fetch(`http://localhost:8000/records/${recordId}`, { method: 'DELETE' })
      if (response.ok) {
        setPatientRecords(prev => prev.filter(r => r.id !== recordId))
        return true
      }
    } catch (err) {
      console.error("Failed to delete record:", err)
    }
    return false
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-sky-500/30">
      <aside className="fixed inset-y-0 left-0 z-50 w-72 border-r border-white/5 bg-black/20 backdrop-blur-2xl transition-all duration-500 xl:translate-x-0">
        <div className="flex h-full flex-col p-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 shadow-lg shadow-sky-500/20 flex items-center justify-center">
                <LayoutDashboard size={20} className="text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-white">DiabEyetic<span className="text-sky-500"> Insight</span></h1>
            </div>
          </motion.div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item, idx) => {
              const Icon = item.icon
              const isActive = activePage === item.key
              return (
                <motion.button
                  key={item.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setActivePage(item.key)}
                  className={`group relative flex w-full items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-300 ${isActive ? 'bg-sky-500/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-glow"
                      className="absolute inset-0 rounded-2xl bg-sky-500/5 shadow-[inset_0_0_20px_rgba(14,165,233,0.1)] border border-sky-500/20"
                    />
                  )}
                  <Icon size={20} className={`relative z-10 ${isActive ? 'text-sky-400' : 'group-hover:text-sky-300'}`} />
                  <span className="relative z-10 font-bold tracking-tight">{item.label}</span>
                </motion.button>
              )
            })}
          </nav>

          <div className="mt-auto space-y-6">
            <div className="rounded-3xl bg-white/5 p-6 border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Live Pulse</p>
              <div className="mt-4 space-y-3">
                {quickStats.map(stat => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">{stat.label}</span>
                    <span className="text-xs font-bold text-sky-400">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <button className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-300">
              <LogOut size={20} />
              <span className="font-bold tracking-tight text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-screen xl:ml-72">
        <header className="sticky top-0 z-40 flex items-center justify-between px-12 py-8 bg-[#020617]/80 backdrop-blur-md">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white">{pageTitle}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">AI-powered retinal health screening for everyone.</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={18} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Find diagnostic record..."
                className="h-12 w-80 rounded-2xl bg-white/5 border border-white/5 pl-12 pr-6 text-sm font-medium text-white outline-none focus:border-sky-500/30 focus:bg-white/10 transition-all"
              />
            </div>

            <div className="flex items-center gap-4 border-l border-white/10 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white leading-none">Guest User</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-400 mt-1">Identity Verified</p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 p-[2px]">
                <div className="h-full w-full rounded-[14px] bg-slate-900 flex items-center justify-center overflow-hidden">
                  <UserRound className="text-sky-400" size={20} />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="px-12 pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {activePage === 'home' && (
                <HomePage
                  onStartAnalysis={() => setActivePage('upload')}
                  onViewDashboard={() => setActivePage('dashboard')}
                  stats={appStats}
                />
              )}
              {activePage === 'dashboard' && <DashboardHome records={patientRecords} stats={appStats} />}
              {activePage === 'upload' && <UploadAnalyzePage onAnalyze={handleDiagnosticAnalysis} />}
              {activePage === 'records' && <PatientRecordsPage records={searchedRecords} onDelete={handleDeleteRecord} />}
              {/* {activePage === 'analytics' && <AnalyticsPage records={patientRecords} />} */}
              {activePage === 'settings' && <SettingsPage />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Chatbot />
    </div>
  )
}

export default App
