import { motion } from 'framer-motion'
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Card, TableHead } from '../components/SharedUI'
import { pageTransition, records, severityDistribution, summaryCards, weeklyScanData } from '../data/mockData'

function DashboardHome() {
  return (
    <motion.div {...pageTransition} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon
          const toneClass = {
            blue: 'text-sky-200 bg-sky-500/10',
            red: 'text-rose-200 bg-rose-500/10',
            amber: 'text-amber-200 bg-amber-500/10',
            green: 'text-emerald-200 bg-emerald-500/10',
          }[card.tone]

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <Card className="h-full bg-slate-900">
                <div className="mb-3 flex items-start justify-between">
                  <p className="text-sm text-slate-400">{card.title}</p>
                  <span className={`rounded-lg p-2 ${toneClass}`}><Icon size={18} /></span>
                </div>
                <p className="text-3xl font-semibold tracking-tight text-white">{card.value}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">Updated today</p>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-slate-900">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Volume watch</p>
              <h3 className="mt-2 text-2xl font-bold text-white">Weekly scan volume</h3>
            </div>
            <Badge label="+14% vs last week" tone="green" />
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={weeklyScanData}>
                <defs>
                  <linearGradient id="scanFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#08111f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', color: '#e2e8f0' }} />
                <Area type="monotone" dataKey="scans" stroke="#38bdf8" strokeWidth={3} fill="url(#scanFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-slate-900 text-white">
          <h3 className="text-2xl font-bold text-white">Severity mix</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">Current cohort distribution across diabetic retinopathy grades.</p>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={severityDistribution} dataKey="value" innerRadius={52} outerRadius={86} paddingAngle={3}>
                  {severityDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#08111f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', color: '#e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {severityDistribution.map((item) => (
              <p key={item.name} className="text-white/75">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                {item.name}
              </p>
            ))}
          </div>
        </Card>
      </div>

      <Card className="bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Case desk</p>
            <h3 className="mt-1 text-2xl font-bold text-white">Recent patients</h3>
          </div>
          <Badge label="Live feed" tone="blue" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <TableHead>Patient ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Last Scan</TableHead>
                <TableHead>DR Grade</TableHead>
                <TableHead>Status</TableHead>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 5).map((patient) => (
                <tr key={patient.id} className="border-b border-white/6 text-white/72">
                  <td className="px-3 py-3">{patient.id}</td>
                  <td className="px-3 py-3 font-medium text-white">{patient.name}</td>
                  <td className="px-3 py-3 text-white/50">{patient.lastScan}</td>
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
