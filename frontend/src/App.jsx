import { useMemo, useState } from 'react'
import { Bell, Search, UserRound } from 'lucide-react'
import { navItems, records } from './data/mockData'
import DashboardHome from './pages/DashboardHome'
import UploadAnalyzePage from './pages/UploadAnalyzePage'
import PatientRecordsPage from './pages/PatientRecordsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [searchTerm, setSearchTerm] = useState('')

  const pageTitle = navItems.find((item) => item.key === activePage)?.label ?? 'Dashboard'

  const searchedRecords = useMemo(() => {
    return records.filter((item) => `${item.id} ${item.name}`.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [searchTerm])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_5%,rgba(59,130,246,0.2),transparent_30%),radial-gradient(circle_at_88%_20%,rgba(34,197,94,0.12),transparent_28%),#0f172a] text-slate-100">
      <aside className="fixed inset-x-0 top-0 z-20 border-b border-slate-700/70 bg-slate-950/90 backdrop-blur lg:inset-y-0 lg:left-0 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col p-4 lg:p-5">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-widest text-blue-300">RetinaCare AI</p>
            <h1 className="text-xl font-semibold text-slate-50">Detection Dashboard</h1>
          </div>
          <nav className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activePage === item.key

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActivePage(item.key)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${isActive ? 'bg-blue-500 text-slate-950' : 'bg-slate-900/70 text-slate-200 hover:bg-slate-800'}`}
                >
                  <Icon size={17} />
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}
          </nav>
          <div className="mt-auto hidden rounded-xl border border-slate-700 bg-slate-900/60 p-3 lg:block">
            <p className="text-sm text-slate-300">System Status</p>
            <p className="mt-1 text-xs text-emerald-300">Model online. Last sync: 4 min ago.</p>
          </div>
        </div>
      </aside>

      <div className="px-4 pb-8 pt-48 lg:ml-72 lg:px-7 lg:pt-7">
        <header className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/75 p-4 shadow-card lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-blue-300">AI Assisted Ophthalmology</p>
            <h2 className="text-2xl font-semibold text-slate-50">{pageTitle}</h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
              <Search size={16} />
              <input
                className="w-full bg-transparent outline-none placeholder:text-slate-500 sm:w-56"
                placeholder="Search patient"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <button type="button" className="relative rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-200">
              <Bell size={18} />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
            </button>

            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
              <UserRound size={18} className="text-blue-300" />
              <div>
                <p className="text-xs font-semibold text-slate-100">Dr. Aryan Mehta</p>
                <p className="text-[11px] text-slate-400">Retina Specialist</p>
              </div>
            </div>
          </div>
        </header>

        {searchTerm && (
          <div className="mb-4 rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-300">
            Search results in records: {searchedRecords.length} match(es)
          </div>
        )}

        {activePage === 'dashboard' && <DashboardHome />}
        {activePage === 'upload' && <UploadAnalyzePage />}
        {activePage === 'records' && <PatientRecordsPage />}
        {activePage === 'analytics' && <AnalyticsPage />}
        {activePage === 'settings' && <SettingsPage />}
      </div>
    </div>
  )
}

export default App
