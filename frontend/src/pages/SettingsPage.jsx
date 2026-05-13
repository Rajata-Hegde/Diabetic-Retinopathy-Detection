import { motion } from 'framer-motion'
import { Bell, Shield, Cloud, Database, Cpu, Lock, Zap, Settings as SettingsIcon, BrainCircuit } from 'lucide-react'

function SettingsPage() {
  const sections = [
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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="relative min-h-[85vh] rounded-[48px] overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
         <img 
          src="/assets/settings_bg.png" 
          className="h-full w-full object-cover opacity-20 scale-105" 
          alt="Settings Background"
         />
         <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#020617]/90 to-[#020617]/40" />
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 p-12 space-y-12"
      >
        {/* Header Section */}
        <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <div className="h-1 w-8 rounded-full bg-sky-500" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400">Core Configuration</span>
              </div>
              <h2 className="text-6xl font-black text-white tracking-tighter">System Settings</h2>
              <p className="mt-2 text-slate-400 font-medium max-w-lg">Manage your AI diagnostic preferences and data persistence protocols.</p>
           </div>
           <div className="h-20 w-20 rounded-[32px] bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-2xl shadow-sky-500/10">
              <SettingsIcon size={40} className="animate-[spin_10s_linear_infinite]" />
           </div>
        </motion.div>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-10">
            {sections.map((section, idx) => {
              const Icon = section.icon
              return (
                <motion.div 
                  key={idx} 
                  variants={item}
                  className="premium-glass p-10 rounded-[48px] border border-white/5 backdrop-blur-3xl group"
                >
                  <div className="flex items-center gap-6 mb-10">
                    <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-sky-500 group-hover:text-white transition-all duration-500">
                      <Icon size={28} />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight">{section.title}</h3>
                  </div>

                  <div className="space-y-6">
                    {section.fields.map((field, fIdx) => (
                      <div key={fIdx} className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group/field">
                        <span className="text-xs font-bold text-slate-500 group-hover/field:text-slate-300 transition-colors uppercase tracking-widest">{field.label}</span>
                        <span className="text-sm font-black text-sky-400 tracking-tight">{field.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="space-y-10">
             <motion.div variants={item} className="premium-glass p-10 rounded-[48px] border border-white/5 backdrop-blur-3xl group">
                <div className="flex items-center justify-between mb-10">
                   <h3 className="text-2xl font-black text-white tracking-tight">System Sync</h3>
                   <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Pipeline</span>
                   </div>
                </div>
                <div className="space-y-4">
                   {[
                     { label: 'Health Alerts', icon: Bell, active: true },
                     { label: 'Cloud Mirror', icon: Cloud, active: false },
                     { label: 'Vault Persistence', icon: Database, active: true }
                   ].map((toggle, i) => (
                     <div key={i} className="flex items-center justify-between p-6 rounded-[32px] bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group/toggle">
                        <div className="flex items-center gap-4">
                           <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${toggle.active ? 'bg-sky-500/10 text-sky-400' : 'bg-slate-800 text-slate-500'}`}>
                              <toggle.icon size={20} />
                           </div>
                           <span className="text-xs font-black text-slate-300 tracking-widest uppercase">{toggle.label}</span>
                        </div>
                        <div className={`h-6 w-12 rounded-full p-1.5 transition-all duration-500 ${toggle.active ? 'bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]' : 'bg-slate-800'}`}>
                           <div className={`h-3 w-3 rounded-full bg-white transition-transform duration-500 ${toggle.active ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                     </div>
                   ))}
                </div>
             </motion.div>

             <motion.div variants={item} className="p-10 rounded-[48px] bg-sky-500/5 border border-sky-500/10 backdrop-blur-xl flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-3xl bg-sky-500/10 flex items-center justify-center text-sky-400 mb-6">
                   <BrainCircuit size={32} />
                </div>
                <h4 className="text-xl font-black text-white tracking-tight">Neural Optimization</h4>
                <p className="text-xs text-slate-500 mt-2 font-medium">Automatic calibration of the DiabEyetic Insight engine is currently enabled for high-fidelity diagnostics.</p>
             </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default SettingsPage
