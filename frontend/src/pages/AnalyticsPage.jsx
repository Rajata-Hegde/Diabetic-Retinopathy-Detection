import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '../components/SharedUI'
import { modelAccuracyData, monthlyGradeData, pageTransition } from '../data/mockData'

function AnalyticsPage() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = ['8a', '10a', '12p', '2p', '4p', '6p']

  return (
    <motion.div {...pageTransition} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-slate-900"><p className="text-sm text-slate-400">Sensitivity</p><p className="text-2xl font-bold text-emerald-200">93.1%</p></Card>
        <Card className="bg-slate-900"><p className="text-sm text-slate-400">Specificity</p><p className="text-2xl font-bold text-sky-200">90.7%</p></Card>
        <Card className="bg-slate-900"><p className="text-sm text-slate-400">AUC Score</p><p className="text-2xl font-bold text-amber-200">0.947</p></Card>
        <Card className="bg-slate-900"><p className="text-sm text-slate-400">False Positive Rate</p><p className="text-2xl font-bold text-white">6.2%</p></Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="bg-slate-900">
          <h3 className="mb-4 text-2xl font-semibold text-white">DR grade distribution by month</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={monthlyGradeData}>
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#08111f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', color: '#e2e8f0' }} />
                <Bar dataKey="grade0" stackId="a" fill="#22C55E" />
                <Bar dataKey="grade1" stackId="a" fill="#60A5FA" />
                <Bar dataKey="grade2" stackId="a" fill="#FACC15" />
                <Bar dataKey="grade3" stackId="a" fill="#F97316" />
                <Bar dataKey="grade4" stackId="a" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-slate-900 text-white">
          <h3 className="mb-4 text-2xl font-semibold text-white">Model accuracy over time</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={modelAccuracyData}>
                <XAxis dataKey="month" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" domain={[86, 94]} />
                <Tooltip contentStyle={{ background: '#08111f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', color: '#e2e8f0' }} />
                <Line type="monotone" dataKey="accuracy" stroke="#5eead4" strokeWidth={3} dot={{ fill: '#5eead4' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="bg-slate-900">
        <h3 className="mb-4 text-2xl font-semibold text-white">Scan volume heatmap</h3>
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="mb-2 grid grid-cols-7 gap-2 pl-16 text-center text-xs text-white/40">
              {days.map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="space-y-2">
              {hours.map((hour, rowIndex) => (
                <div key={hour} className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] gap-2">
                  <span className="text-xs text-white/40">{hour}</span>
                  {days.map((day, colIndex) => {
                    const intensity = ((rowIndex + 2) * (colIndex + 3) * 17) % 100
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className="h-8 rounded-xl border border-white/8"
                        style={{ background: `rgba(34,211,238,${0.14 + intensity / 140})` }}
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
