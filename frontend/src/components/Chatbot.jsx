import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, ChevronDown, Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react'

/* ─────────────────────────────────────────────
   GEMINI API HELPER
   Replace VITE_GEMINI_API_KEY in your .env file
   e.g.  VITE_GEMINI_API_KEY=AIza...
───────────────────────────────────────────── */
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`

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
    // Fallback when no key is set
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

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sorry, I could not generate a response.'
}

/* Offline fallback responses keyed on keywords */
function getFallbackResponse(msg) {
  const q = msg.toLowerCase()
  if (q.includes('grade 0') || q.includes('no dr')) return 'Grade 0 means No Diabetic Retinopathy. The retina appears normal. Annual screening is recommended for diabetic patients.'
  if (q.includes('grade 1') || q.includes('mild')) return 'Grade 1 (Mild NPDR): Only microaneurysms are present. Follow-up every 6–12 months is advised.'
  if (q.includes('grade 2') || q.includes('moderate')) return 'Grade 2 (Moderate NPDR): Dot/blot hemorrhages and hard exudates are visible. Monitor every 3–6 months.'
  if (q.includes('grade 3') || q.includes('severe')) return 'Grade 3 (Severe NPDR): Extensive hemorrhages in all 4 retinal quadrants, venous beading, and IRMA. Prompt specialist referral is needed.'
  if (q.includes('grade 4') || q.includes('proliferative') || q.includes('pdr')) return 'Grade 4 (PDR): Neovascularization is present — new, fragile blood vessels grow on the retina. This is a medical emergency requiring urgent laser photocoagulation or anti-VEGF injections.'
  if (q.includes('treatment') || q.includes('therapy')) return 'DR treatments include: laser photocoagulation (burns abnormal vessels), anti-VEGF injections (bevacizumab, ranibizumab), vitrectomy for advanced cases, and strict blood sugar/BP control to slow progression.'
  if (q.includes('symptom')) return 'DR is often asymptomatic in early stages. Advanced symptoms include blurry vision, floaters, dark spots, difficulty seeing colors, and sudden vision loss.'
  if (q.includes('cause') || q.includes('why')) return 'DR is caused by long-term high blood glucose damaging the small blood vessels of the retina. Duration of diabetes and poor glycemic control are the biggest risk factors.'
  if (q.includes('prevent') || q.includes('avoid')) return 'Prevention includes tight blood glucose control (HbA1c < 7%), blood pressure management, regular retinal screening, healthy diet, and avoiding smoking.'
  if (q.includes('ai') || q.includes('model') || q.includes('detect')) return 'This platform uses a deep learning CNN model trained on thousands of retinal fundus images to classify DR severity into 5 grades (0–4). The model achieves ~93% accuracy.'
  if (q.includes('refer') || q.includes('specialist')) return 'Patients with Grade 3 or Grade 4 DR should be urgently referred to a vitreoretinal specialist. Grade 2 patients with macular edema also require prompt specialist review.'
  return `I'm RetinAI, your DR assistant. I can help with questions about diabetic retinopathy grades, symptoms, treatments, and how the AI model works.\n\n⚠️ Note: To enable full AI responses, add your Gemini API key as VITE_GEMINI_API_KEY in a .env file.`
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
      setError('Could not reach the AI. Check your API key or network.')
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
