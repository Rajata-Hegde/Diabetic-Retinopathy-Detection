import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button, Card } from '../components/SharedUI'
import { pageTransition } from '../data/mockData'

function SettingsPage() {
  const [threshold, setThreshold] = useState(72)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  return (
    <motion.div {...pageTransition} className="grid gap-5 xl:grid-cols-2">
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-50">Model Threshold</h3>
        <p className="mb-4 text-sm text-slate-400">Adjust DR classification sensitivity threshold.</p>
        <input
          type="range"
          min="50"
          max="95"
          value={threshold}
          onChange={(event) => setThreshold(Number(event.target.value))}
          className="w-full accent-blue-500"
        />
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>50</span>
          <span className="font-semibold text-blue-300">Current: {threshold}</span>
          <span>95</span>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-50">Notification Preferences</h3>
        <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/40 p-3">
          <div>
            <p className="text-sm font-semibold text-slate-100">Critical case alerts</p>
            <p className="text-xs text-slate-400">Email + in-app alerts for high severity detections.</p>
          </div>
          <button
            type="button"
            className={`h-7 w-12 rounded-full p-1 transition ${notificationsEnabled ? 'bg-blue-500' : 'bg-slate-700'}`}
            onClick={() => setNotificationsEnabled((prev) => !prev)}
          >
            <span className={`block h-5 w-5 rounded-full bg-white transition ${notificationsEnabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </Card>

      <Card className="xl:col-span-2">
        <h3 className="mb-4 text-lg font-semibold text-slate-50">Doctor Profile</h3>
        <form className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-300">
            Full Name
            <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none ring-blue-400 focus:ring-2" defaultValue="Dr. Aryan Mehta" />
          </label>
          <label className="text-sm text-slate-300">
            Email
            <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none ring-blue-400 focus:ring-2" defaultValue="aryan.mehta@retinacare.ai" />
          </label>
          <label className="text-sm text-slate-300">
            Specialization
            <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none ring-blue-400 focus:ring-2" defaultValue="Retina Specialist" />
          </label>
          <label className="text-sm text-slate-300">
            Hospital
            <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none ring-blue-400 focus:ring-2" defaultValue="VisionPlus Medical Center" />
          </label>
          <div className="sm:col-span-2">
            <Button type="button">Save Settings</Button>
          </div>
        </form>
      </Card>
    </motion.div>
  )
}

export default SettingsPage
