import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Bell, Shield, Smartphone, Globe, Cloud, Database, Cpu, UserCircle, Key, Activity, Heart } from 'lucide-react'

function SettingsPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  }

  const sections = [
    {
      title: 'Personal Health Profile',
      icon: Heart,
      fields: [
        { label: 'Patient Display Name', value: 'Guest User' },
        { label: 'Preferred Language', value: 'English (Global)' },
        { label: 'Health Data Region', value: 'India (South)' }
      ]
    },
    {
      title: 'AI Analysis Configuration',
      icon: Cpu,
      fields: [
        { label: 'Analysis Sensitivity', value: 'High Precision' },
        { label: 'Neural Bridge Version', value: 'DiabEyetic-Insight v2.4' },
        { label: 'Explainability Mode', value: 'Patient-Friendly Visuals' }
      ]
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      fields: [
        { label: 'Cloud Backup', value: 'End-to-End Encrypted' },
        { label: 'Diagnostic History', value: 'Stored Locally' },
        { label: 'Anonymous Usage', value: 'Enabled' }
      ]
    }
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-10 lg:grid-cols-3"
    >
      <div className="lg:col-span-2 space-y-10">
        {sections.map((section, idx) => {
          const Icon = section.icon
          return (
            <motion.div
              key={idx}
              variants={item}
              className="premium-glass p-10 rounded-[48px] border border-white/5"
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-sky-400">
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">{section.title}</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">General Preferences</p>
                </div>
              </div>

              <div className="grid gap-6">
                {section.fields.map((field, fIdx) => (
                  <div key={fIdx} className="flex flex-col gap-2 p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{field.label}</span>
                    <span className="text-lg font-bold text-white tracking-tight">{field.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="space-y-10">
        <motion.div variants={item} className="premium-glass p-10 rounded-[48px] border border-white/5 bg-gradient-to-br from-sky-500/10 to-transparent">
          <div className="h-16 w-16 rounded-3xl bg-sky-500 flex items-center justify-center text-white mb-8 shadow-xl shadow-sky-500/20">
            <Key size={32} />
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight">Access Control</h3>
          <p className="text-sm leading-relaxed text-slate-400 mt-4 font-medium">Manage your personal API keys and external intelligence links for personalized health insights.</p>
          <button className="mt-8 h-14 w-full rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-sky-400 hover:text-white transition-all">
            Update Credentials
          </button>
        </motion.div>

        <motion.div variants={item} className="premium-glass p-10 rounded-[48px] border border-white/5">
          <h3 className="text-xl font-black text-white tracking-tight">System Notification</h3>
          <div className="mt-8 space-y-6">
            {[
              { label: 'Health Alerts', icon: Bell, active: true },
              { label: 'Cloud Sync', icon: Cloud, active: false },
              { label: 'Offline Mode', icon: Database, active: true }
            ].map((toggle, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5">
                <div className="flex items-center gap-3">
                  <toggle.icon size={16} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-300 tracking-tight">{toggle.label}</span>
                </div>
                <div className={`h-5 w-10 rounded-full p-1 transition-colors ${toggle.active ? 'bg-sky-500' : 'bg-slate-800'}`}>
                  <div className={`h-3 w-3 rounded-full bg-white transition-transform ${toggle.active ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default SettingsPage
