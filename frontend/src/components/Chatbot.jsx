import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, ChevronDown, Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react'

/* ─────────────────────────────────────────────
   GEMINI API HELPER
   Replace VITE_GEMINI_API_KEY in your .env file
   e.g.  VITE_GEMINI_API_KEY=AIza...
───────────────────────────────────────────── */
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${API_KEY}`

const SYSTEM_CONTEXT = `You are RetinAI, a friendly and knowledgeable medical AI assistant embedded inside the DiabEYEtic Insight platform — a clinical dashboard for Diabetic Retinopathy (DR) detection and patient management.

Your role is to:
- Answer questions about Diabetic Retinopathy (causes, grades, symptoms, treatment, prevention)
- Explain AI/ML concepts used in retinal image analysis
- Help users understand DR severity grades (0–4)
- Provide general ophthalmology guidance
- Help clinicians interpret patient data trends from the platform

DR Grade Reference:
- Grade 0: No DR — No visible changes. Annual screening recommended.
- Grade 1: Mild NPDR — Microaneurysms only. Monitor every 6–12 months.
- Grade 2: Moderate NPDR — More than microaneurysms; dot/blot hemorrhages. Monitor every 3–6 months.
- Grade 3: Severe NPDR — "4-2-1" rule: extensive hemorrhages in 4 quadrants, venous beading in 2, IRMA in 1. Refer promptly.
- Grade 4: Proliferative DR — Neovascularization. Urgent laser/anti-VEGF treatment required.

Always be concise, empathetic, and medically accurate. Remind users that you are an AI assistant and that clinical decisions must be validated by a qualified ophthalmologist. If asked something outside DR or ophthalmology, politely redirect.`

/* ── Suggested starter questions ── */
const SUGGESTIONS = [
  'What is diabetic retinopathy?',
  'Explain Grade 3 NPDR severity',
  'What treatments exist for PDR?',
  'How does the AI model detect DR?',
  'When should a patient be referred?',
]

async function askGemini(history, userMessage) {
  if (!API_KEY) {
    return getFallbackResponse(userMessage)
  }

  const contents = [
    { role: 'user', parts: [{ text: SYSTEM_CONTEXT }] },
    { role: 'model', parts: [{ text: 'Understood. I am RetinAI, ready to assist.' }] },
    ...history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ]

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    }),
  })

  if (!res.ok) {
    // On rate limit, silently fall back to built-in knowledge
    if (res.status === 429) return getFallbackResponse(userMessage)
    if (res.status === 400) throw new Error('BAD_REQUEST')
    if (res.status === 403) throw new Error('INVALID_KEY')
    throw new Error(`API_ERROR_${res.status}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sorry, I could not generate a response.'
}

/* Offline fallback — comprehensive DR knowledge base */
function getFallbackResponse(msg) {
  const q = msg.toLowerCase()

  // DR Grades
  if (q.includes('grade 0') || q.includes('no dr') || q.includes('no diabetic'))
    return 'Grade 0 — No Diabetic Retinopathy:\nThe retina appears completely normal with no visible changes. However, regular annual screening is still essential for all diabetic patients, as DR can develop silently.'

  if (q.includes('grade 1') || (q.includes('mild') && q.includes('npdr')))
    return 'Grade 1 — Mild NPDR (Non-Proliferative DR):\nOnly microaneurysms are present — tiny balloon-like swellings in the retinal blood vessels. Vision is typically unaffected. Follow-up every 6–12 months is recommended.'

  if (q.includes('grade 2') || (q.includes('moderate') && q.includes('npdr')))
    return 'Grade 2 — Moderate NPDR:\nMore widespread changes including dot & blot hemorrhages, hard exudates, and cotton-wool spots. Vision may start to be affected. Monitor every 3–6 months. Macular edema risk increases.'

  if (q.includes('grade 3') || (q.includes('severe') && q.includes('npdr')))
    return 'Grade 3 — Severe NPDR:\nDefined by the "4-2-1 rule":\n• Hemorrhages in all 4 retinal quadrants\n• Venous beading in ≥2 quadrants\n• IRMA (intraretinal microvascular abnormalities) in ≥1 quadrant\nPrompt referral to a vitreoretinal specialist is needed — ~50% progress to PDR within 1 year.'

  if (q.includes('grade 4') || q.includes('proliferative') || q.includes(' pdr'))
    return 'Grade 4 — Proliferative DR (PDR):\nNew, fragile blood vessels grow on the retina/vitreous (neovascularization). These can bleed, causing vitreous hemorrhage or tractional retinal detachment.\n⚠️ Medical emergency — urgent treatment required:\n• Pan-retinal photocoagulation (laser)\n• Anti-VEGF injections (ranibizumab, bevacizumab)\n• Vitrectomy surgery if severe'

  // What is DR
  if (q.includes('what is') || q.includes('diabetic retinopathy') || q.includes('what are'))
    return 'Diabetic Retinopathy (DR) is a diabetes complication that damages the blood vessels in the retina — the light-sensitive tissue at the back of the eye.\n\nIt progresses through 5 grades (0–4):\n• Grade 0: No DR\n• Grade 1: Mild NPDR\n• Grade 2: Moderate NPDR\n• Grade 3: Severe NPDR\n• Grade 4: Proliferative DR\n\nDR is a leading cause of blindness in working-age adults worldwide, but early detection and treatment can prevent up to 90% of vision loss.'

  // Symptoms
  if (q.includes('symptom') || q.includes('sign') || q.includes('vision'))
    return 'DR Symptoms:\n\n🔴 Early stages (Grade 0–2): Often NO symptoms — this is why regular screening is critical.\n\n🟡 As it progresses:\n• Blurred or fluctuating vision\n• Floaters (dark spots or strings)\n• Difficulty seeing colors\n• Dark or empty areas in vision\n• Poor night vision\n\n🔴 Advanced (Grade 3–4):\n• Sudden, severe vision loss\n• Vitreous hemorrhage (dark red cloud)\n\nAlways consult an ophthalmologist if any of these occur.'

  // Causes & risk factors
  if (q.includes('cause') || q.includes('risk') || q.includes('factor') || q.includes('why'))
    return 'Causes & Risk Factors for DR:\n\n🔑 Primary cause: Chronic high blood glucose damages retinal capillaries, causing them to leak, swell, or grow abnormally.\n\nKey risk factors:\n• Long duration of diabetes (>10 years)\n• Poor glycemic control (HbA1c > 7%)\n• High blood pressure (hypertension)\n• High cholesterol\n• Pregnancy (gestational diabetes)\n• Kidney disease (nephropathy)\n• Smoking\n• Obesity\n\nThe longer and less controlled diabetes is, the higher the DR risk.'

  // Prevention
  if (q.includes('prevent') || q.includes('avoid') || q.includes('reduce risk'))
    return 'Preventing DR Progression:\n\n✅ Blood sugar control: Keep HbA1c < 7% (reduces risk by 76%)\n✅ Blood pressure: Maintain < 130/80 mmHg\n✅ Cholesterol: Control LDL levels\n✅ Regular screening: Annual dilated eye exams\n✅ Don\'t smoke: Smoking accelerates vascular damage\n✅ Healthy diet: Low glycaemic index foods\n✅ Exercise regularly: Improves insulin sensitivity\n✅ Early treatment: Intervene before PDR develops\n\n💡 Tight control of all three (glucose, BP, lipids) is the most effective prevention strategy.'

  // Treatment
  if (q.includes('treatment') || q.includes('therapy') || q.includes('inject') || q.includes('laser') || q.includes('surgery'))
    return 'DR Treatments by Stage:\n\n📋 Grade 0–1: Optimize diabetes control. Annual monitoring.\n\n📋 Grade 2: Control blood sugar & BP. Monitor for macular edema.\n\n💉 Anti-VEGF Injections (Grade 2–4):\n• Ranibizumab (Lucentis)\n• Bevacizumab (Avastin)\n• Aflibercept (Eylea)\nInhibit abnormal vessel growth. Injected into the eye monthly.\n\n🔦 Laser Photocoagulation:\n• Focal laser: treats macular edema\n• Pan-retinal photocoagulation (PRP): burns peripheral retina to reduce oxygen demand in PDR\n\n🔪 Vitrectomy Surgery:\nRemoves vitreous gel + blood in cases of vitreous hemorrhage or tractional retinal detachment.\n\nAll treatments slow progression but cannot restore lost vision.'

  // Screening
  if (q.includes('screen') || q.includes('check') || q.includes('exam') || q.includes('test') || q.includes('diagnos'))
    return 'DR Screening:\n\n🔍 Who should be screened?\n• Type 1 diabetes: within 5 years of diagnosis, then annually\n• Type 2 diabetes: at diagnosis, then annually\n• Pregnant diabetics: each trimester\n\n🏥 How is DR diagnosed?\n• Dilated fundus examination (gold standard)\n• Fundus photography (used in this platform)\n• Optical Coherence Tomography (OCT) — for macular edema\n• Fluorescein Angiography (FA) — maps blood vessel leakage\n\n🤖 This platform uses AI-powered fundus image analysis to grade DR severity.'

  // Referral
  if (q.includes('refer') || q.includes('specialist') || q.includes('urgent') || q.includes('emergency'))
    return 'When to Refer a Patient:\n\n🚨 URGENT (same day/week):\n• Grade 4 (PDR) — neovascularization present\n• Vitreous hemorrhage\n• Tractional retinal detachment\n• Rubeosis iridis (new vessels on iris)\n\n⚡ SOON (within 4 weeks):\n• Grade 3 (Severe NPDR)\n• Clinically significant macular edema (CSME)\n• Rapid unexplained visual loss\n\n📅 ROUTINE (within 3 months):\n• Grade 2 with macular changes\n• Uncertain findings requiring specialist opinion\n\nRefer to a Vitreoretinal Specialist or Medical Retina clinic.'

  // AI / model
  if (q.includes('ai') || q.includes('model') || q.includes('cnn') || q.includes('deep learning') || q.includes('detect') || q.includes('accuracy') || q.includes('how does'))
    return 'How the AI Detection Works:\n\n🧠 Model Architecture: Convolutional Neural Network (CNN) trained on thousands of annotated retinal fundus images.\n\n📊 Performance:\n• Overall accuracy: ~93.1%\n• Classifies DR into 5 grades (0–4)\n• Processes images in seconds\n\n🔬 What it detects:\n• Microaneurysms (Grade 1+)\n• Hemorrhages (Grade 2+)\n• Hard exudates & cotton-wool spots\n• Venous beading & IRMA (Grade 3)\n• Neovascularization (Grade 4)\n\n⚠️ The AI is a clinical decision support tool — all results must be reviewed by a qualified ophthalmologist before treatment decisions are made.'

  // Macular edema
  if (q.includes('macula') || q.includes('edema') || q.includes('oedema'))
    return 'Diabetic Macular Edema (DME):\n\nDME is the most common cause of vision loss in DR. It occurs when fluid leaks into the macula (central retina responsible for sharp vision).\n\n🎯 Can occur at any grade of DR\n\nSymptoms:\n• Blurred central vision\n• Colors appear washed out\n• Straight lines look wavy\n\nTreatment:\n• Anti-VEGF injections (first-line)\n• Focal laser photocoagulation\n• Intravitreal steroid implants (Ozurdex)\n\nDetected using OCT imaging. Clinically significant macular edema (CSME) requires urgent treatment.'

  // Microaneurysm
  if (q.includes('microaneurysm') || q.includes('hemorrhage') || q.includes('exudate') || q.includes('cotton'))
    return 'Key Retinal Findings in DR:\n\n🔴 Microaneurysms: Tiny balloon-like outpouchings of weakened capillary walls. The first sign of DR (Grade 1). Appear as small red dots.\n\n🔴 Hemorrhages:\n• Dot hemorrhages: round, deep in retina\n• Blot hemorrhages: larger, irregular\n• Flame hemorrhages: along nerve fibers\n\n🟡 Hard exudates: Yellowish-white deposits of leaked lipids. Indicate blood-retinal barrier breakdown.\n\n⬜ Cotton-wool spots: White fluffy patches. Indicate nerve fiber infarction from ischemia.\n\n🔵 Venous beading: Irregular vein caliber — sign of severe ischemia (Grade 3).\n\n🔴 Neovascularization: New, fragile vessels (Grade 4 — PDR).'

  // HbA1c
  if (q.includes('hba1c') || q.includes('blood sugar') || q.includes('glucose') || q.includes('insulin'))
    return 'Blood Sugar Control & DR:\n\n📊 Target HbA1c: < 7% (53 mmol/mol)\n\nEvidence:\n• DCCT trial: Tight control reduces DR risk by 76% in Type 1\n• UKPDS trial: Each 1% HbA1c reduction = 35% less microvascular risk\n\n⚠️ Rapid improvement in control can temporarily worsen DR — gradual reduction is safer.\n\nDaily glucose monitoring + long-term HbA1c control is the single most powerful intervention to prevent DR progression.'

  // Platform features
  if (q.includes('platform') || q.includes('dashboard') || q.includes('feature') || q.includes('upload') || q.includes('record'))
    return 'DiabEYEtic Insight Platform Features:\n\n📊 Dashboard: Real-time statistics — scans today, urgent cases, pending reviews.\n\n📤 Upload & Analyze: Upload retinal fundus images → AI grades DR severity (0–4) instantly.\n\n👥 Patient Records: Full patient history with scan timelines and grade progression.\n\n📈 Analytics: Weekly scan volume, severity distribution, model accuracy trends.\n\n⚙️ Settings: Customize screening protocols and notification thresholds.\n\n🤖 RetinAI (me!): AI assistant for clinical guidance and DR education.'

  // Default
  return 'I\'m RetinAI, your DR Clinical Assistant! I can help you with:\n\n• 🔬 DR grades (0–4) explained\n• 🩺 Symptoms & diagnosis\n• 💊 Treatments (laser, anti-VEGF, surgery)\n• 🛡️ Prevention strategies\n• 🤖 How the AI detection model works\n• 📋 When to refer patients\n• 👁️ Macular edema & retinal findings\n\nTry asking: "What is Grade 3 NPDR?" or "When should I refer a patient?"'
}

/* ── Message bubble ── */
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isUser && (
        <div className="chatbot-avatar">
          <Bot size={14} />
        </div>
      )}
      <div className={`chatbot-bubble ${isUser ? 'chatbot-bubble-user' : 'chatbot-bubble-bot'}`}>
        {msg.content.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i < msg.content.split('\n').length - 1 && <br />}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

/* ── Typing indicator ── */
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="flex gap-2"
    >
      <div className="chatbot-avatar">
        <Bot size={14} />
      </div>
      <div className="chatbot-bubble chatbot-bubble-bot chatbot-typing">
        <span /><span /><span />
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────
   MAIN CHATBOT COMPONENT
───────────────────────────────────────────── */
export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm **RetinAI**, your AI assistant for diabetic retinopathy insights.\n\nAsk me about DR grades, symptoms, treatments, or how the AI detection works!",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200)
  }, [open])

  const sendMessage = async (text) => {
    const content = (text ?? input).trim()
    if (!content || loading) return

    setInput('')
    setError('')
    const userMsg = { role: 'user', content }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setLoading(true)

    try {
      const reply = await askGemini(messages, content)
      setMessages([...newHistory, { role: 'assistant', content: reply }])
    } catch (err) {
      const code = err.message
      if (code === 'RATE_LIMIT') {
        setError('Rate limit hit (429). Your API key may be overused or revoked. Please get a new key at aistudio.google.com/app/apikey and update your .env file.')
      } else if (code === 'INVALID_KEY') {
        setError('Invalid API key (403). Check that VITE_GEMINI_API_KEY in your .env is correct, then restart the dev server.')
      } else if (code === 'BAD_REQUEST') {
        setError('Bad request (400). The message may be too long — try starting a new conversation.')
      } else {
        setError('Could not reach the AI. Check your network connection and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* ── Chat Window ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="chatbot-window"
          >
            {/* Header */}
            <div className="chatbot-header">
              <div className="chatbot-header-left">
                <div className="chatbot-header-icon">
                  <Sparkles size={16} />
                </div>
                <div>
                  <p className="chatbot-header-title">RetinAI</p>
                  <p className="chatbot-header-sub">DR Clinical Assistant</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="chatbot-icon-btn"
                  title="Minimise"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setMessages([{
                      role: 'assistant',
                      content: "👋 Hi! I'm **RetinAI**, your AI assistant for diabetic retinopathy insights.\n\nAsk me about DR grades, symptoms, treatments, or how the AI detection works!",
                    }])
                  }}
                  className="chatbot-icon-btn"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="chatbot-messages">
              {/* Suggestions (shown once, at top) */}
              {messages.length === 1 && (
                <div className="chatbot-suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendMessage(s)}
                      className="chatbot-suggestion-chip"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}

              <AnimatePresence>
                {loading && <TypingIndicator key="typing" />}
              </AnimatePresence>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="chatbot-error"
                >
                  ⚠ {error}
                </motion.p>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="chatbot-input-row">
              <textarea
                ref={inputRef}
                id="chatbot-input"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about DR grades, symptoms…"
                className="chatbot-textarea"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="chatbot-send-btn"
                id="chatbot-send"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>

            <p className="chatbot-footer">
              RetinAI may make mistakes. Always consult a qualified ophthalmologist.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Trigger Button ── */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="chatbot-fab"
        id="chatbot-fab"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        title="Open RetinAI assistant"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <X size={24} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <MessageCircle size={24} />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulse ring */}
        {!open && (
          <span className="chatbot-fab-pulse" />
        )}
      </motion.button>
    </>
  )
}
