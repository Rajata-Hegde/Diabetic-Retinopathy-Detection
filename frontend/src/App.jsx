import { useMemo, useState } from 'react'
import { Bell, Search, UserRound } from 'lucide-react'
import { navItems, records } from './data/mockData'
import HomePage from './pages/HomePage'
import DashboardHome from './pages/DashboardHome'
import UploadAnalyzePage from './pages/UploadAnalyzePage'
import PatientRecordsPage from './pages/PatientRecordsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import Chatbot from './components/Chatbot'
import './App.css'

function App() {
  const [activePage, setActivePage] = useState('home')
  const [searchTerm, setSearchTerm] = useState('')

  const pageTitle = navItems.find((item) => item.key === activePage)?.label ?? 'Dashboard'
  const quickStats = [
    { label: 'Today', value: '48 scans' },
    { label: 'Urgent', value: '7 cases' },
    { label: 'Accuracy', value: '93.1%' },
  ]

  const searchedRecords = useMemo(() => {
    return records.filter((item) => `${item.id} ${item.name}`.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [searchTerm])

  return (
    <div className="app-shell min-h-screen overflow-hidden text-slate-100">
      <div className="absolute inset-0 -z-10">
        <div className="paper-noise" />
        <div className="paper-grid" />
        <div className="paper-orb one" />
        <div className="paper-orb two" />
      </div>

      <aside className="fixed inset-x-0 top-0 z-30 border-b border-slate-800/90 bg-slate-950/95 backdrop-blur xl:inset-y-0 xl:left-0 xl:w-80 xl:border-b-0 xl:border-r xl:border-r-slate-800/90">
        <div className="flex h-full flex-col gap-6 p-5 text-white xl:p-7">
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Diabetic Retinopathy Detection</p>
              <h1 className="mt-2 text-3xl font-bold text-white">RetinaCare</h1>
              <p className="mt-2 max-w-[16rem] text-sm leading-6 text-slate-400">
                A clean clinical workspace for screening, review, and patient monitoring.
              </p>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-2 xl:grid-cols-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activePage === item.key

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActivePage(item.key)}
                  className={`group flex items-center gap-3 rounded-[24px] px-4 py-3 text-left text-sm transition-all duration-300 ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className={`grid h-10 w-10 place-items-center rounded-2xl ${isActive ? 'bg-sky-500 text-white' : 'bg-slate-900 text-slate-400 group-hover:text-sky-300'}`}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <span className="block truncate font-semibold">{item.label}</span>
                    <span className={`text-xs ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>
                      {item.key === 'home' ? 'Welcome overview' : item.key === 'upload' ? 'Analyze new scans' : 'Workspace module'}
                    </span>
                  </div>
                </button>
              )
            })}
          </nav>

          <div className="mt-auto hidden rounded-[24px] border border-slate-800 bg-slate-900/80 p-5 xl:block">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Operations Pulse</p>
            <div className="mt-4 space-y-3">
              {quickStats.map((item) => (
                <div key={item.label} className="flex items-center justify-between border-b border-dashed border-slate-800 pb-3 last:border-b-0 last:pb-0">
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <span className="text-sm font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <div className="px-4 pb-8 pt-48 xl:ml-80 xl:px-8 xl:pt-8">
        <header className="mb-6 grid gap-4 rounded-[28px] border border-slate-800 bg-slate-900/90 p-6 xl:grid-cols-[1.3fr_1fr]">
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">AI Assisted Ophthalmology</p>
            <h2 className="mt-2 text-3xl font-bold text-white">{pageTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Simple, readable clinical tooling for retinal screening and patient review.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <label className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
              <Search size={16} className="text-slate-500" />
              <input
                className="w-full bg-transparent text-white outline-none placeholder:text-slate-500 sm:w-56"
                placeholder="Search patient"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <button type="button" className="relative rounded-full border border-slate-700 bg-slate-950 p-3 text-slate-200 transition-all duration-300 hover:bg-slate-900">
              <Bell size={18} />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500" />
            </button>

            <div className="flex items-center gap-3 rounded-full border border-slate-700 bg-slate-950 px-4 py-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-sky-500 text-white">
                <UserRound size={18} />
              </span>
              <div>
                <p className="text-xs font-semibold text-white">Dr. Aryan Mehta</p>
                <p className="text-[11px] text-slate-500">Retina Specialist</p>
              </div>
            </div>
          </div>
        </header>

        {searchTerm && (
          <div className="mb-5 rounded-[24px] border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
            Search results in records: <span className="font-semibold text-white">{searchedRecords.length}</span> match(es)
          </div>
        )}

        {activePage === 'home' && <HomePage />}
        {activePage === 'dashboard' && <DashboardHome />}
        {activePage === 'upload' && <UploadAnalyzePage />}
        {activePage === 'records' && <PatientRecordsPage />}
        {activePage === 'analytics' && <AnalyticsPage />}
        {activePage === 'settings' && <SettingsPage />}
      </div>

      {/* Global floating chatbot — visible on every page */}
      <Chatbot />
    </div>
  )
}

export default App
