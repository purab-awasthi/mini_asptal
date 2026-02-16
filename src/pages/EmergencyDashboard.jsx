import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

// --- CONSTANTS & HELPERS ---
const seedMessages = []

const FIRST_AID_GUIDES = [
  {
    key: 'heart_attack',
    title: 'Heart Attack',
    keywords: ['heart attack', 'chest pain', 'pressure', 'tightness', 'crushing'],
    steps: [
      'Call emergency services immediately.',
      'Have the person rest and stay calm.',
      'If prescribed, assist with nitroglycerin.',
      'If not allergic, give one aspirin to chew.',
    ],
  },
  {
    key: 'stroke',
    title: 'Stroke',
    keywords: ['stroke', 'face droop', 'arm weakness', 'slurred speech', 'fast'],
    steps: [
      'Call emergency services immediately.',
      'Note the time symptoms started.',
      'Keep the person still and comfortable.',
      'Do not give food or drink.',
    ],
  },
  {
    key: 'choking',
    title: 'Choking',
    keywords: ['choking', "can't breathe", 'cannot breathe', 'airway', 'coughing'],
    steps: [
      'Ask if they can cough or speak.',
      'If not, give 5 back blows.',
      'Then give 5 abdominal thrusts.',
      'Repeat until help arrives.',
    ],
  },
  {
    key: 'severe_bleeding',
    title: 'Severe Bleeding',
    keywords: ['severe bleeding', 'bleeding heavily', 'bleeding', 'blood loss'],
    steps: [
      'Apply firm direct pressure.',
      'Use a clean cloth or bandage.',
      'Keep pressure until help arrives.',
      'Elevate the wound if possible.',
    ],
  },
  {
    key: 'burns',
    title: 'Burns',
    keywords: ['burn', 'burns', 'scald'],
    steps: [
      'Cool the burn with running water.',
      'Remove tight items near the burn.',
      'Cover with a clean, dry cloth.',
      'Do not apply creams or ice.',
    ],
  },
]

const getFirstAidGuides = (text) => {
  if (!text) return []
  const lowered = text.toLowerCase()
  return FIRST_AID_GUIDES.filter((guide) =>
    guide.keywords.some((keyword) => lowered.includes(keyword)),
  )
}

// ⚡ SMART LOCAL ANALYSIS (Fallback)
const localAnalyze = (text) => {
  const lower = text.toLowerCase()
  let risk = 10
  let severity = "LOW"
  let advice = "Monitor symptoms. Consult a doctor if they persist."

  if (lower.includes('chest') || lower.includes('heart') || lower.includes('breathing') || lower.includes('unconscious')) {
    risk = 95
    severity = "EMERGENCY"
    advice = "This sounds critical. Call emergency services immediately."
  } else if (lower.includes('blood') || lower.includes('cut') || lower.includes('broken') || lower.includes('burn')) {
    risk = 65
    severity = "HIGH"
    advice = "Apply first aid immediately. Visit a hospital."
  } else if (lower.includes('fever') || lower.includes('headache') || lower.includes('vomit')) {
    risk = 30
    severity = "MODERATE"
    advice = "Stay hydrated and rest. Use OTC medication if needed."
  }

  return JSON.stringify({
    severity,
    riskScore: risk,
    advice,
    disclaimer: "AI Estimate. Not medical advice."
  })
}

const analyzeSymptoms = async (history) => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    })

    if (!response.ok) throw new Error('API unavailable')
    
    const data = await response.json()
    return data.text

  } catch (err) {
    const lastUserMessage = history[history.length - 1].content
    return localAnalyze(lastUserMessage)
  }
}

const safeParse = (value, fallback) => {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

// --- MAIN COMPONENT ---

function EmergencyDashboard() {
  const [messages, setMessages] = useState(seedMessages)
  const [input, setInput] = useState('')
  const [isEmergency, setIsEmergency] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [contacts, setContacts] = useState([])
  const [selectedContactId, setSelectedContactId] = useState('')
  const [isFindingHospitals, setIsFindingHospitals] = useState(false)
  const [hospitalError, setHospitalError] = useState('')
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [lastRiskScore, setLastRiskScore] = useState(null)
  
  const [insuranceInfo, setInsuranceInfo] = useState({
    provider: '', policyNumber: '', policyHolder: '', relationship: 'Self',
    helpline: '', validTill: '', coverageType: '', tpa: '',
  })
  const [insuranceNotice, setInsuranceNotice] = useState('')
  const [isInsuranceVisible, setIsInsuranceVisible] = useState(false)
  
  const [medicalCard, setMedicalCard] = useState({
    fullName: '', bloodGroup: '', allergies: '', medications: '',
    conditions: '', emergencyContact: '', insurance: '',
  })
  const [medicalNotice, setMedicalNotice] = useState('')

  // --- EFFECTS ---

  useEffect(() => {
    const stored = localStorage.getItem('emergencyContacts')
    if (stored) {
      const parsed = safeParse(stored, [])
      if (Array.isArray(parsed)) {
        setContacts(parsed)
        if (parsed.length > 0) setSelectedContactId(parsed[0].id)
      }
    }
  }, [])

  useEffect(() => {
    const storedMed = localStorage.getItem('medicalCard')
    if (storedMed) {
      const parsed = safeParse(storedMed, null)
      if (parsed?.data) setMedicalCard((prev) => ({ ...prev, ...parsed.data }))
      else if (parsed && typeof parsed === 'object') setMedicalCard((prev) => ({ ...prev, ...parsed }))
    }

    const storedIns = localStorage.getItem('insuranceInfo')
    if (storedIns) {
      const parsed = safeParse(storedIns, null)
      if (parsed && typeof parsed === 'object') setInsuranceInfo((prev) => ({ ...prev, ...parsed }))
    }
  }, [])

  useEffect(() => {
    if (insuranceNotice) {
      const timeout = setTimeout(() => setInsuranceNotice(''), 3000)
      return () => clearTimeout(timeout)
    }
  }, [insuranceNotice])

  useEffect(() => {
    if (medicalNotice) {
      const timeout = setTimeout(() => setMedicalNotice(''), 3000)
      return () => clearTimeout(timeout)
    }
  }, [medicalNotice])

  // --- VOICE LOGIC ---
  useEffect(() => {
    if (!isVoiceMode) {
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setHospitalError('Voice mode is not supported in this browser.')
      setIsVoiceMode(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => isVoiceMode ? recognition.start() : setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1]
      const transcript = last?.[0]?.transcript?.trim()
      if (transcript) sendMessage(transcript)
    }

    recognition.start()
    return () => recognition.stop()
  }, [isVoiceMode])

  const speakText = (text) => {
    if (!isVoiceMode || !text || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.speak(utterance)
  }

  // --- ACTIONS ---

  const handleSend = async (event) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    sendMessage(trimmed)
  }

  const sendMessage = async (text) => {
    const userMessage = { id: Date.now(), sender: 'user', text }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const history = [...messages, userMessage].map((m) =>({
        role: m.sender === 'user' ? 'user' : 'assistant', content: m.text
      }))

      const responseText = await analyzeSymptoms(history)
      let parsed = null
      try { parsed = JSON.parse(responseText) } catch { parsed = null }

      let botText = 'I could not generate guidance right now.'

      if (parsed?.followUpQuestions?.length) {
        botText = parsed.followUpQuestions.join(' ')
      } else if (parsed?.severity && typeof parsed?.riskScore === 'number') {
        const riskScore = Math.max(0, Math.min(100, Math.round(parsed.riskScore)))
        botText = `Severity: ${parsed.severity}\nRiskScore: ${riskScore}\nAdvice: ${parsed.advice || ''}`
        setLastRiskScore(riskScore)
        if (parsed.severity === 'EMERGENCY') setIsEmergency(true)
      }

      const botMessage = { id: Date.now() + 1, sender: 'bot', text: botText }
      setMessages((prev) => [...prev, botMessage])
      speakText(botText)
    } catch (error) {
      const fallback = 'Service is temporarily unavailable.'
      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'bot', text: fallback }])
    } finally {
      setIsLoading(false)
    }
  }

  const selectedContact = contacts.find((c) => c.id === selectedContactId)
  const primaryContact = selectedContact || contacts[0]

  const handleCallContact = () => primaryContact && (window.location.href = `tel:${primaryContact.phone}`)
  
  const handleFindHospitals = () => {
    if (!navigator.geolocation) return setHospitalError('Geolocation not supported.')
    setIsFindingHospitals(true)
    setHospitalError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.location.href = `https://www.google.com/maps/search/hospitals/@${pos.coords.latitude},${pos.coords.longitude},14z`
        setIsFindingHospitals(false)
      },
      () => { setIsFindingHospitals(false); setHospitalError('Location permission denied.') }
    )
  }

  const handleSendLocationAlert = () => {
    if (!primaryContact || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      const mapLink = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`
      const body = encodeURIComponent(`Medical Emergency! My location: ${mapLink}`)
      window.location.href = `sms:${primaryContact.phone}?body=${body}`
    })
  }

  const medicalInfoText = useMemo(() => {
    const contactLine = primaryContact ? `${primaryContact.name} (${primaryContact.phone})` : medicalCard.emergencyContact
    return `Name: ${medicalCard.fullName}\nBlood: ${medicalCard.bloodGroup}\nAllergies: ${medicalCard.allergies}\nConditions: ${medicalCard.conditions}\nMeds: ${medicalCard.medications}\nContact: ${contactLine}\nIns: ${insuranceInfo.provider}`
  }, [medicalCard, insuranceInfo, primaryContact])

  const handleCopy = async (text, setNotice) => {
    try { await navigator.clipboard.writeText(text); setNotice('Copied!') } 
    catch { setNotice('Copy failed.') }
  }

  const handleShare = async (title, text, setNotice) => {
    if (navigator.share) {
      try { await navigator.share({ title, text }); setNotice('Shared!') } catch {}
    } else {
      handleCopy(text, setNotice)
    }
  }

  const riskScore = lastRiskScore ?? 0

  return (
    <div className="app dashboard">
      
      {/* --- HEADER --- */}
      <header className="onboarding-header">
        <div className="header-brand-icon">
            <span style={{ fontSize: '2rem' }}>🚑</span>
        </div>
        <h1 className="onboarding-title">Sankat AI</h1>
        <p className="onboarding-subtitle" style={{ color: 'var(--text-muted)' }}>Emergency Response System</p>
        <Link to="/onboarding" style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>
            Edit Profile
        </Link>
      </header>

      {/* --- TOP SECTION --- */}
      <section className="onboarding-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <p className="progress-label">PATIENT</p>
           <h2 style={{ margin: 0 }}>{medicalCard.fullName || 'Guest'}</h2>
        </div>
        <div>
           <p className="progress-label">BLOOD GROUP</p>
           <h2 style={{ margin: 0, color: 'var(--primary)' }}>{medicalCard.bloodGroup || '?'}</h2>
        </div>
      </section>

      {/* --- EMERGENCY PANEL --- */}
      {isEmergency && (
        <section className="onboarding-section" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ color: 'var(--primary)' }}>⚠️ Possible Emergency</h2>
            <p>Risk Score: <strong>{riskScore}</strong></p>
          </div>
          
          <div className="form-grid">
             <a href="tel:108" className="dock-btn primary" style={{ textAlign: 'center', textDecoration: 'none' }}>
               Call Ambulance
             </a>
             <button onClick={handleCallContact} disabled={!primaryContact} className="dock-btn secondary" style={{ background: 'white' }}>
               Call Contact
             </button>
             <button onClick={handleSendLocationAlert} disabled={!primaryContact} className="dock-btn secondary" style={{ background: 'white' }}>
               Share Location
             </button>
             <button onClick={handleFindHospitals} className="dock-btn secondary" style={{ background: 'white' }}>
               Find Hospital
             </button>
          </div>
          <button 
             onClick={() => setIsEmergency(false)}
             style={{ background: 'none', border: 'none', color: 'var(--text-muted)', width: '100%', marginTop: '10px', cursor: 'pointer' }}
          >
             Dismiss
          </button>
        </section>
      )}

      {/* --- MAIN GRID --- */}
      <div className="form-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        
        {/* LEFT: INFO CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           
           {/* Medical ID */}
           <div className="onboarding-section" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                 <h3>Medical ID</h3>
                 <button onClick={() => handleShare('Medical ID', medicalInfoText, setMedicalNotice)} className="ghost-button">Share</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 <div><small className="progress-label">ALLERGIES</small><p style={{ margin: 0 }}>{medicalCard.allergies || 'None'}</p></div>
                 <div><small className="progress-label">CONDITIONS</small><p style={{ margin: 0 }}>{medicalCard.conditions || 'None'}</p></div>
                 <div><small className="progress-label">MEDS</small><p style={{ margin: 0 }}>{medicalCard.medications || 'None'}</p></div>
              </div>
              {medicalNotice && <small style={{ color: 'green', display: 'block', marginTop: '5px' }}>{medicalNotice}</small>}
           </div>

           {/* Insurance */}
           <div className="onboarding-section" style={{ padding: '16px' }}>
              <h3>Insurance</h3>
              <div><small className="progress-label">PROVIDER</small><p style={{ margin: 0 }}>{insuranceInfo.provider || 'N/A'}</p></div>
              <div><small className="progress-label">POLICY #</small><p style={{ margin: 0 }}>{insuranceInfo.policyNumber || 'N/A'}</p></div>
           </div>
        </div>

        {/* RIGHT: CHAT */}
        <div className="onboarding-section" style={{ display: 'flex', flexDirection: 'column', height: '600px', padding: '0' }}>
           <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{margin:0}}>AI Triage</h3>
              <small style={{color:'gray'}}>Describe symptoms for guidance</small>
           </div>
           
           {/* Messages */}
           <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.length === 0 && (
                  <div style={{ textAlign: 'center', marginTop: '50px', color: '#9CA3AF' }}>
                      <span style={{ fontSize: '2rem' }}>🩺</span>
                      <p>Type symptoms or tap Mic to speak</p>
                  </div>
              )}
              
              {messages.map((msg) => (
                 <div key={msg.id} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <div style={{ 
                       padding: '12px 16px', borderRadius: '16px', 
                       background: msg.sender === 'user' ? 'var(--primary)' : '#F3F4F6',
                       color: msg.sender === 'user' ? 'white' : '#1F2937',
                       boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                       <p style={{margin:0, whiteSpace: 'pre-wrap'}}>{msg.text}</p>
                    </div>
                 </div>
              ))}
              {isLoading && <small style={{ marginLeft: '10px', color: 'gray' }}>Analyzing...</small>}
           </div>

           {/* ⚡ NEW CHAT INPUT DOCK (SVG ICONS) */}
           <form onSubmit={handleSend} style={{ 
               padding: '12px', 
               borderTop: '1px solid var(--border-subtle)', 
               display: 'flex', 
               alignItems: 'center', 
               gap: '8px' 
           }}>
              {/* INPUT FIELD */}
              <input 
                 type="text" 
                 value={input} 
                 onChange={(e) => setInput(e.target.value)} 
                 placeholder={isListening ? "Listening..." : "Type symptoms..."}
                 style={{ 
                     flex: 1, padding: '12px 16px', borderRadius: '24px',
                     border: '1px solid var(--border-subtle)', outline: 'none',
                     background: '#F9FAFB'
                 }}
              />

              {/* 🎤 MIC BUTTON (SVG) */}
              <button 
                type="button"
                onClick={() => setIsVoiceMode(!isVoiceMode)}
                style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    border: 'none', cursor: 'pointer',
                    background: isVoiceMode ? '#FEE2E2' : '#F3F4F6', // Red tint if active
                    color: isVoiceMode ? '#DC2626' : '#6B7280',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                }}
                title="Toggle Voice"
              >
                 {/* SVG Microphone Icon */}
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                 </svg>
              </button>

              {/* ➤ SEND BUTTON (SVG) */}
              <button 
                type="submit" 
                disabled={isLoading} 
                style={{ 
                    width: '44px', height: '44px', borderRadius: '50%',
                    border: 'none', cursor: 'pointer',
                    background: 'var(--primary)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
              >
                 {/* SVG Send/PaperPlane Icon */}
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(45deg) translateX(-2px)' }}>
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                 </svg>
              </button>
           </form>
        </div>

      </div>

      {hospitalError && (
        <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'black', color: 'white', padding: '10px 20px', borderRadius: '20px', zIndex: 2000 }}>
           {hospitalError}
        </div>
      )}

      {/* FLOATING SOS BUTTON */}
      <button 
        className="sos-floating-btn"
        onClick={() => setIsEmergency(true)}
      >
        SOS
      </button>

    </div>
  )
}

export default EmergencyDashboard