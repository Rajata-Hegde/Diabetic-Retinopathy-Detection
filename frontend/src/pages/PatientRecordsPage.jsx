import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { pageTransition, records } from '../data/mockData'

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

function TableHead({ children }) {
  return <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">{children}</th>
}

function DetailModal({ patient, onClose }) {
  if (!patient) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-5"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-50">{patient.name}</h3>
            <p className="text-sm text-slate-400">Patient ID: {patient.id}</p>
          </div>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Card className="p-3"><p className="text-xs text-slate-400">Age</p><p className="text-lg font-semibold">{patient.age}</p></Card>
          <Card className="p-3"><p className="text-xs text-slate-400">Grade</p><p className="text-lg font-semibold">{patient.grade}</p></Card>
          <Card className="p-3"><p className="text-xs text-slate-400">Risk</p><RiskBadge risk={patient.risk} /></Card>
        </div>

        <Card className="p-4">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Scan History Timeline</h4>
          <ol className="space-y-3">
            {patient.timeline.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                {item}
              </li>
            ))}
          </ol>
        </Card>
      </motion.div>
    </div>
  )
}

function PatientRecordsPage() {
  const [recordSearch, setRecordSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const pageSize = 4

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const matchesSearch = `${item.id} ${item.name}`.toLowerCase().includes(recordSearch.toLowerCase())
      const matchesFilter = riskFilter === 'All' || item.risk === riskFilter
      return matchesSearch && matchesFilter
    })
  }, [recordSearch, riskFilter])

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRecords.slice(start, start + pageSize)
  }, [page, filteredRecords])

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / pageSize))

  return (
    <>
      <motion.div {...pageTransition} className="space-y-5">
        <Card>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h3 className="text-lg font-semibold text-slate-50">Patient Records</h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-blue-400 focus:ring-2"
                placeholder="Search by patient ID or name"
                value={recordSearch}
                onChange={(event) => {
                  setRecordSearch(event.target.value)
                  setPage(1)
                }}
              />
              <select
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none"
                value={riskFilter}
                onChange={(event) => {
                  setRiskFilter(event.target.value)
                  setPage(1)
                }}
              >
                <option>All</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Last Scan Date</TableHead>
                  <TableHead>DR Grade</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Action</TableHead>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((patient) => (
                  <tr key={patient.id} className="border-b border-slate-800 text-slate-200">
                    <td className="px-3 py-3">{patient.id}</td>
                    <td className="px-3 py-3">{patient.name}</td>
                    <td className="px-3 py-3">{patient.age}</td>
                    <td className="px-3 py-3">{patient.lastScan}</td>
                    <td className="px-3 py-3">{patient.grade}</td>
                    <td className="px-3 py-3"><RiskBadge risk={patient.risk} /></td>
                    <td className="px-3 py-3">
                      <Button variant="ghost" className="text-xs" onClick={() => setSelectedPatient(patient)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
            <p>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredRecords.length)} of {filteredRecords.length}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={page === 1} onClick={() => setPage((prev) => prev - 1)}>Prev</Button>
              <Button variant="ghost" disabled={page === pageCount} onClick={() => setPage((prev) => prev + 1)}>Next</Button>
            </div>
          </div>
        </Card>
      </motion.div>

      <DetailModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
    </>
  )
}

export default PatientRecordsPage
