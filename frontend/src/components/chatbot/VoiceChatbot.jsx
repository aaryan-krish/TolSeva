import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, X, MessageCircle, Volume2, VolumeX, Send } from 'lucide-react'
import { askBot } from '../../services/api.js'
import { useLanguage } from '../../context/LanguageContext.jsx'

export default function VoiceChatbot() {
  const { language, currentLangObj, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Namaste! Hello! I am the TolSeva Voice Assistant. I can help you with instrument registration, appointments, and the Legal Metrology Act. Ask me anything in your chosen language!' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)
  const bottomRef = useRef(null)

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const supported = !!SpeechRecognition

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const speak = useCallback((text) => {
    if (!ttsEnabled || !synthRef.current) return
    synthRef.current.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = currentLangObj?.speechCode || 'en-IN'
    utter.rate = 0.95
    utter.pitch = 1
    synthRef.current.speak(utter)
  }, [ttsEnabled, currentLangObj])

  async function sendMessage(text) {
    if (!text.trim()) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text }])
    setLoading(true)
    setError('')
    try {
      const res = await askBot(text, language)
      const reply = res.data.reply
      setMessages(m => [...m, { role: 'bot', text: reply }])
      speak(reply)
    } catch {
      setError('Could not reach assistant. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  function startListening() {
    if (!supported) { setError('Voice input not supported in your browser. Please type your query.'); return }
    setError('')
    const recognition = new SpeechRecognition()
    recognition.lang = currentLangObj?.speechCode || 'en-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput(transcript)
      sendMessage(transcript)
    }
    recognition.onerror = (e) => {
      setError('Voice error: ' + e.error + '. Please try again or type your query.')
      setListening(false)
    }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  function handleClose() {
    synthRef.current?.cancel()
    stopListening()
    setOpen(false)
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className='fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-emerald-600 text-white shadow-2xl hover:bg-emerald-500 transition-all flex items-center justify-center border-4 border-green-600 animate-pulse'
          title='Open TolSeva Voice Assistant'
        >
          <MessageCircle size={28} />
        </button>
      )}

      {open && (
        <div className='fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden' style={{ maxHeight: '520px' }}>
          <div className='bg-emerald-600 px-4 py-3 flex items-center justify-between flex-shrink-0'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 rounded-full bg-green-600 flex items-center justify-center'>
                <Mic size={16} className='text-white' />
              </div>
              <div>
                <p className='text-white font-bold text-sm'>TolSeva Assistant</p>
                <p className='text-blue-300 text-xs'>Voice &amp; Text Support</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <button onClick={() => setTtsEnabled(t => !t)} title={ttsEnabled ? 'Mute TTS' : 'Enable TTS'} className='text-blue-300 hover:text-white'>
                {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button onClick={handleClose} className='text-blue-300 hover:text-white'><X size={16} /></button>
            </div>
          </div>

          <div className='flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50'>
            {messages.map((msg, i) => (
              <div key={i} className={'flex ' + (msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={'max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ' + (msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm')}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className='flex justify-start'>
                <div className='bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm'>
                  <div className='flex gap-1'>
                    <span className='w-2 h-2 bg-emerald-400 rounded-full animate-bounce' style={{ animationDelay: '0ms' }} />
                    <span className='w-2 h-2 bg-emerald-400 rounded-full animate-bounce' style={{ animationDelay: '150ms' }} />
                    <span className='w-2 h-2 bg-emerald-400 rounded-full animate-bounce' style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            {error && <p className='text-xs text-red-500 text-center'>{error}</p>}
            <div ref={bottomRef} />
          </div>

          <div className='border-t border-gray-200 px-3 py-3 bg-white flex-shrink-0'>
            <div className='flex gap-2'>
              <input
                type='text'
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                placeholder='Type or speak your query...'
                className='flex-1 text-sm border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400'
                disabled={loading}
              />
              {supported && (
                <button
                  onMouseDown={startListening}
                  onMouseUp={stopListening}
                  onTouchStart={startListening}
                  onTouchEnd={stopListening}
                  className={'p-2.5 rounded-full transition-all ' + (listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-emerald-600 hover:text-white')}
                  title='Hold to speak'
                >
                  {listening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              )}
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className='p-2.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 transition-colors'
              >
                <Send size={18} />
              </button>
            </div>
            <p className='text-xs text-gray-400 text-center mt-2'>{supported ? '🎤 Hold mic button to speak' : '⌨️ Type your query'}</p>
          </div>
        </div>
      )}
    </>
  )
}