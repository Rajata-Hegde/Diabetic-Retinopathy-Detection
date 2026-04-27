import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { modelAccuracyData, monthlyGradeData, pageTransition } from '../data/mockData'

function Card({ children, className = '' }) {
  return <section className={`rounded-2xl border border-slate-700/70 bg-slate-900/75 p-4 shadow-card ${className}`}>{children}</section>
}

function AnalyticsPage() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = ['8a', '10a', '12p', '2p', '4p', '6p']

  return (
    <motion.div {...pageTransition} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-slate-400">Sensitivity</p><p className="text-2xl font-bold text-emerald-300">93.1%</p></Card>
        <Card><p className="text-sm text-slate-400">Specificity</p><p className="text-2xl font-bold text-blue-300">90.7%</p></Card>
        <Card><p className="text-sm text-slate-400">AUC Score</p><p className="text-2xl font-bold text-amber-300">0.947</p></Card>
        <Card><p className="text-sm text-slate-400">False Positive Rate</p><p className="text-2xl font-bold text-slate-100">6.2%</p></Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-50">DR Grade Distribution by Month</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={monthlyGradeData}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                <Bar dataKey="grade0" stackId="a" fill="#22C55E" />
                <Bar dataKey="grade1" stackId="a" fill="#60A5FA" />
                <Bar dataKey="grade2" stackId="a" fill="#FACC15" />
                <Bar dataKey="grade3" stackId="a" fill="#F97316" />
                <Bar dataKey="grade4" stackId="a" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-50">Model Accuracy Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={modelAccuracyData}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[86, 94]} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                <Line type="monotone" dataKey="accuracy" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#93c5fd' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-50">Scan Volume Heatmap (Day x Hour)</h3>
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="mb-2 grid grid-cols-7 gap-2 pl-16 text-center text-xs text-slate-400">
              {days.map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="space-y-2">
              {hours.map((hour, rowIndex) => (
                <div key={hour} className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] gap-2">
                  <span className="text-xs text-slate-400">{hour}</span>
                  {days.map((day, colIndex) => {
                    const intensity = ((rowIndex + 2) * (colIndex + 3) * 17) % 100
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className="h-8 rounded-md border border-slate-700"
                        style={{ background: `rgba(59,130,246,${0.15 + intensity / 140})` }}
                        title={`${day} ${hour}: ${intensity} scans`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default AnalyticsPage
