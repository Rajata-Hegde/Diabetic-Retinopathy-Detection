import { motion } from 'framer-motion'
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  pageTransition,
  records,
  severityDistribution,
  summaryCards,
  weeklyScanData,
} from '../data/mockData'

function Card({ children, className = '' }) {
  return <section className={`rounded-2xl border border-slate-700/70 bg-slate-900/75 p-4 shadow-card ${className}`}>{children}</section>
}

function Badge({ label, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-800 text-slate-100 border-slate-700',
    green: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
    yellow: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    orange: 'bg-orange-500/20 text-orange-300 border-orange-400/40',
    red: 'bg-red-500/20 text-red-300 border-red-400/40',
  }

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{label}</span>
}

function TableHead({ children }) {
  return <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">{children}</th>
}

function DashboardHome() {
  return (
    <motion.div {...pageTransition} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon
          const toneClass = {
            blue: 'text-blue-300 bg-blue-500/20',
            red: 'text-red-300 bg-red-500/20',
            amber: 'text-amber-300 bg-amber-500/20',
            green: 'text-emerald-300 bg-emerald-500/20',
          }[card.tone]

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <Card className="h-full">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-slate-400">{card.title}</p>
                  <span className={`rounded-lg p-2 ${toneClass}`}><Icon size={18} /></span>
                </div>
                <p className="text-3xl font-semibold tracking-tight text-slate-50">{card.value}</p>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-slate-50">Weekly Scan Volume</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={weeklyScanData}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                <Line type="monotone" dataKey="scans" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-50">DR Severity Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={severityDistribution} dataKey="value" innerRadius={52} outerRadius={86} paddingAngle={3}>
                  {severityDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {severityDistribution.map((item) => (
              <p key={item.name} className="text-slate-300">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                {item.name}
              </p>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-50">Recent Patients</h3>
          <Badge label="Live Feed" tone="blue" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <TableHead>Patient ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Last Scan</TableHead>
                <TableHead>DR Grade</TableHead>
                <TableHead>Status</TableHead>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 5).map((patient) => (
                <tr key={patient.id} className="border-b border-slate-800 text-slate-200">
                  <td className="px-3 py-3">{patient.id}</td>
                  <td className="px-3 py-3">{patient.name}</td>
                  <td className="px-3 py-3">{patient.lastScan}</td>
                  <td className="px-3 py-3">{patient.grade}</td>
                  <td className="px-3 py-3">
                    <Badge label={patient.status} tone={patient.status === 'Urgent' ? 'red' : patient.status === 'Pending' ? 'yellow' : 'green'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  )
}

export default DashboardHome
