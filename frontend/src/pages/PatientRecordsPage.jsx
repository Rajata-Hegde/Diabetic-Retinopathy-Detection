import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Badge, Button, Card, TableHead } from '../components/SharedUI'
import { pageTransition, records } from '../data/mockData'

function RiskBadge({ risk }) {
  const tone = { Low: 'green', Medium: 'yellow', High: 'orange', Critical: 'red' }[risk] || 'slate'
  return <Badge label={risk} tone={tone} />
}

function DetailModal({ patient, onClose }) {
  if (!patient) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl rounded-[24px] border border-slate-700 bg-slate-900 p-6"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">{patient.name}</h3>
            <p className="text-sm text-slate-400">Patient ID: {patient.id}</p>
          </div>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Card className="bg-slate-950 p-3"><p className="text-xs text-slate-500">Age</p><p className="text-lg font-semibold text-white">{patient.age}</p></Card>
          <Card className="bg-slate-950 p-3"><p className="text-xs text-slate-500">Grade</p><p className="text-lg font-semibold text-white">{patient.grade}</p></Card>
          <Card className="bg-slate-950 p-3"><p className="text-xs text-slate-500">Risk</p><RiskBadge risk={patient.risk} /></Card>
        </div>

        <Card className="bg-slate-950 p-4">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Scan History Timeline</h4>
          <ol className="space-y-3">
            {patient.timeline.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-white/72">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
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
        <Card className="bg-slate-900">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Case library</p>
              <h3 className="mt-1 text-2xl font-bold text-white">Patient records</h3>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none ring-sky-300 focus:ring-2"
                placeholder="Search by patient ID or name"
                value={recordSearch}
                onChange={(event) => {
                  setRecordSearch(event.target.value)
                  setPage(1)
                }}
              />
              <select
                className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none"
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
                <tr className="border-b border-slate-800">
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
                  <tr key={patient.id} className="border-b border-slate-800 text-white/72">
                    <td className="px-3 py-3">{patient.id}</td>
                    <td className="px-3 py-3 font-medium text-white">{patient.name}</td>
                    <td className="px-3 py-3">{patient.age}</td>
                    <td className="px-3 py-3 text-slate-400">{patient.lastScan}</td>
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
