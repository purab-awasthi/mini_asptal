import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const seedMessages = []

const FIRST_AID_GUIDES = [
  {
    key: 'heart_attack',
    title: 'Heart Attack',
    keywords: ['heart attack', 'chest pain', 'pressure', 'tightness'],
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

const analyzeSymptoms = async (history) => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history }),
  })

  if (!response.ok) {
    throw new Error('Unable to analyze symptoms right now.')
  }

  const data = await response.json()
  return data.text
}

const safeParse = (value, fallback) => {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

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
    provider: '',
    policyNumber: '',
    policyHolder: '',
    relationship: 'Self',
    helpline: '',
    validTill: '',
    coverageType: '',
    tpa: '',
  })
  const [insuranceNotice, setInsuranceNotice] = useState('')
  const [isInsuranceVisible, setIsInsuranceVisible] = useState(false)
  const [medicalCard, setMedicalCard] = useState({
    fullName: '',
    bloodGroup: '',
    allergies: '',
    medications: '',
    conditions: '',
    emergencyContact: '',
    insurance: '',
  })
  const [medicalNotice, setMedicalNotice] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('emergencyContacts')
    if (stored) {
      const parsed = safeParse(stored, [])
      if (Array.isArray(parsed)) {
        setContacts(parsed)
        if (parsed.length > 0) {
          setSelectedContactId(parsed[0].id)
        }
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('emergencyContacts', JSON.stringify(contacts))
  }, [contacts])

  useEffect(() => {
    const stored = localStorage.getItem('medicalCard')
    if (stored) {
      const parsed = safeParse(stored, null)
      if (parsed?.data) {
        setMedicalCard((prev) => ({ ...prev, ...parsed.data }))
      } else if (parsed && typeof parsed === 'object') {
        setMedicalCard((prev) => ({ ...prev, ...parsed }))
      }
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('insuranceInfo')
    if (stored) {
      const parsed = safeParse(stored, null)
      if (parsed && typeof parsed === 'object') {
        setInsuranceInfo((prev) => ({ ...prev, ...parsed }))
      }
    }
  }, [])

  useEffect(() => {
    if (!insuranceNotice) return
    const timeout = setTimeout(() => setInsuranceNotice(''), 3000)
    return () => clearTimeout(timeout)
  }, [insuranceNotice])

  useEffect(() => {
    if (!medicalNotice) return
    const timeout = setTimeout(() => setMedicalNotice(''), 3000)
    return () => clearTimeout(timeout)
  }, [medicalNotice])

  useEffect(() => {
    if (!isVoiceMode) {
      setIsListening(false)
      return
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
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
    recognition.onend = () => {
      if (isVoiceMode) {
        recognition.start()
      } else {
        setIsListening(false)
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1]
      const transcript = last?.[0]?.transcript?.trim()
      if (transcript) {
        sendMessage(transcript)
      }
    }

    recognition.start()

    return () => {
      recognition.onend = null
      recognition.onresult = null
      recognition.onerror = null
      recognition.stop()
    }
  }, [isVoiceMode])

  const speakText = (text) => {
    if (!isVoiceMode || !text || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1
    window.speechSynthesis.speak(utterance)
  }

  const handleSend = async (event) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return

    sendMessage(trimmed)
  }

  const sendMessage = async (text) => {
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const history = [...messages, userMessage].map((message) => ({
        role: message.sender === 'user' ? 'user' : 'assistant',
        content: message.text,
      }))

      const responseText = await analyzeSymptoms(history)
      let parsed = null

      try {
        parsed = JSON.parse(responseText)
      } catch {
        parsed = null
      }

      let botText = 'I could not generate guidance right now.'

      if (parsed?.followUpQuestions?.length) {
        botText = parsed.followUpQuestions.join(' ')
      } else if (parsed?.severity && typeof parsed?.riskScore === 'number') {
        const riskScore = Math.max(
          0,
          Math.min(100, Math.round(parsed.riskScore)),
        )

        botText = `Severity: ${parsed.severity}
RiskScore: ${riskScore}
Advice: ${parsed.advice || ''}
Disclaimer: ${parsed.disclaimer || 'This is not a medical diagnosis.'}`

        setLastRiskScore(riskScore)
        if (parsed.severity === 'EMERGENCY') {
          setIsEmergency(true)
        }
      }

      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botText,
      }

      setMessages((prev) => [...prev, botMessage])
      speakText(botText)
    } catch (error) {
      const fallback =
        'Service is temporarily unavailable. If this feels urgent, contact emergency services now.'
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: fallback,
        },
      ])
      speakText(fallback)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedContact = contacts.find(
    (contact) => contact.id === selectedContactId,
  )
  const primaryContact = selectedContact || contacts[0]

  const handleCallContact = () => {
    if (!primaryContact) return
    window.location.href = `tel:${primaryContact.phone}`
  }

  const handleFindHospitals = () => {
    if (!navigator.geolocation) {
      setHospitalError('Geolocation is not supported in this browser.')
      return
    }

    setIsFindingHospitals(true)
    setHospitalError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        const url = `https://www.google.com/maps/search/?api=1&query=hospitals%20near%20me&center=${latitude},${longitude}`
        window.location.href = url
        setIsFindingHospitals(false)
      },
      () => {
        setIsFindingHospitals(false)
        setHospitalError('Location permission denied.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const handleSendLocationAlert = () => {
    if (!primaryContact) return
    if (!navigator.geolocation) {
      setHospitalError('Geolocation is not supported in this browser.')
      return
    }

    setIsFindingHospitals(true)
    setHospitalError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`
        const body = encodeURIComponent(
          `I may be experiencing a medical emergency. My location: ${mapLink}`,
        )
        window.location.href = `sms:${primaryContact.phone}?body=${body}`
        setIsFindingHospitals(false)
      },
      () => {
        setIsFindingHospitals(false)
        setHospitalError('Location permission denied.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const medicalInfoText = useMemo(() => {
    const contactLine = primaryContact
      ? `${primaryContact.name} (${primaryContact.phone})`
      : medicalCard.emergencyContact
    return [
      'Emergency Medical Info',
      `Name: ${medicalCard.fullName || 'N/A'}`,
      `Blood Group: ${medicalCard.bloodGroup || 'N/A'}`,
      `Allergies: ${medicalCard.allergies || 'N/A'}`,
      `Conditions: ${medicalCard.conditions || 'N/A'}`,
      `Medications: ${medicalCard.medications || 'N/A'}`,
      `Emergency Contact: ${contactLine || 'N/A'}`,
      `Insurance Provider: ${insuranceInfo.provider || 'N/A'}`,
    ].join('\n')
  }, [medicalCard, insuranceInfo, primaryContact])

  const handleCopyMedicalInfo = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(medicalInfoText)
        setMedicalNotice('Medical info copied.')
      } else {
        setMedicalNotice('Clipboard not supported in this browser.')
      }
    } catch {
      setMedicalNotice('Unable to copy medical info.')
    }
  }

  const handleShareMedicalInfo = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Medical Info', text: medicalInfoText })
        setMedicalNotice('Medical info shared.')
      } catch (error) {
        if (error?.name !== 'AbortError') {
          setMedicalNotice('Unable to share medical info.')
        }
      }
      return
    }

    handleCopyMedicalInfo()
  }

  const handleShareInsurance = async () => {
    const text = [
      'Insurance Details',
      `Provider: ${insuranceInfo.provider || 'N/A'}`,
      `Policy Number: ${insuranceInfo.policyNumber || 'N/A'}`,
      `Policy Holder: ${insuranceInfo.policyHolder || 'N/A'}`,
      `Helpline: ${insuranceInfo.helpline || 'N/A'}`,
    ].join('\n')

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Insurance Details', text })
        setInsuranceNotice('Details shared.')
      } catch (error) {
        if (error?.name !== 'AbortError') {
          setInsuranceNotice('Unable to share details.')
        }
      }
      return
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        setInsuranceNotice('Details copied for sharing.')
      } else {
        setInsuranceNotice('Share not supported in this browser.')
      }
    } catch (error) {
      setInsuranceNotice('Unable to share details.')
    }
  }

  const riskScore = lastRiskScore ?? 0

  return (
    <div className="app dashboard">
      <header className="dashboard-header">
        <div>
          <p className="brand-title">Emergency Dashboard</p>
          <p className="brand-subtitle">
            Fast access to medical data and AI triage tools.
          </p>
        </div>
        <Link to="/onboarding" className="profile-link">
          Profile
        </Link>
      </header>

      <section className="top-section card-surface">
        <div>
          <p className="top-label">Patient</p>
          <p className="top-value">{medicalCard.fullName || 'N/A'}</p>
        </div>
        <div>
          <p className="top-label">Blood Group</p>
          <p className="blood-badge">{medicalCard.bloodGroup || 'N/A'}</p>
        </div>
        <button
          type="button"
          className="sos-primary"
          onClick={() => setIsEmergency(true)}
        >
          SOS
        </button>
      </section>

      {isEmergency && (
        <section className="emergency-panel active" aria-live="polite">
          <div className="emergency-panel__content">
            <div className="emergency-panel__title">
              <h2>Possible Medical Emergency</h2>
              <p>Stay calm. Use the actions below.</p>
            </div>
            <div className="emergency-panel__risk card-surface">
              <p className="risk-label">Risk Score</p>
              <p className="risk-value">{lastRiskScore ?? 'N/A'}</p>
            </div>
            <div className="emergency-panel__actions">
              <a className="emergency-btn" href="tel:108">
                Call Ambulance
              </a>
              <button
                className="emergency-btn secondary"
                type="button"
                onClick={handleCallContact}
                disabled={!primaryContact}
              >
                Call Emergency Contact
              </button>
              <button
                className="emergency-btn secondary"
                type="button"
                onClick={handleSendLocationAlert}
                disabled={!primaryContact}
              >
                Send Location Alert
              </button>
              <button
                className="emergency-btn secondary"
                type="button"
                onClick={handleFindHospitals}
              >
                {isFindingHospitals ? 'Searching...' : 'Find Nearest Hospital'}
              </button>
              <button
                className="emergency-btn secondary"
                type="button"
                onClick={() => setIsInsuranceVisible((prev) => !prev)}
              >
                {isInsuranceVisible ? 'Hide Insurance Details' : 'Show Insurance Details'}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="dashboard-grid">
        <div className="medical-card-primary card-surface">
          <div className="medical-card-header">
            <div>
              <p className="medical-card-label">Blood Group</p>
              <p className="medical-card-value blood-large">
                {medicalCard.bloodGroup || 'N/A'}
              </p>
            </div>
            <div className="medical-actions">
              <button type="button" onClick={handleCallContact}>
                Call Emergency Contact
              </button>
              <button type="button" onClick={handleCopyMedicalInfo}>
                Copy Medical Info
              </button>
              <button type="button" onClick={handleShareMedicalInfo}>
                Share Medical Info
              </button>
            </div>
          </div>
          <div className="medical-details">
            <div>
              <p className="medical-card-label">Allergies</p>
              <p className="medical-card-value">
                {medicalCard.allergies || 'N/A'}
              </p>
            </div>
            <div>
              <p className="medical-card-label">Conditions</p>
              <p className="medical-card-value">
                {medicalCard.conditions || 'N/A'}
              </p>
            </div>
            <div>
              <p className="medical-card-label">Medications</p>
              <p className="medical-card-value">
                {medicalCard.medications || 'N/A'}
              </p>
            </div>
            <div>
              <p className="medical-card-label">Emergency Contact</p>
              <p className="medical-card-value">
                {primaryContact
                  ? `${primaryContact.name} (${primaryContact.phone})`
                  : medicalCard.emergencyContact || 'N/A'}
              </p>
            </div>
            <div>
              <p className="medical-card-label">Insurance Provider</p>
              <p className="medical-card-value">
                {insuranceInfo.provider || 'N/A'}
              </p>
            </div>
          </div>
          {medicalNotice && <p className="notice">{medicalNotice}</p>}
        </div>

        <div className="triage-panel card-surface">
          <div className="triage-header">
            <div>
              <h3>Emergency AI Triage</h3>
              <p>Describe symptoms for quick guidance.</p>
            </div>
            <button
              type="button"
              className={`voice-toggle ${isVoiceMode ? 'active' : ''}`}
              onClick={() => setIsVoiceMode((prev) => !prev)}
            >
              {isVoiceMode ? 'Voice On' : 'Voice Off'}
            </button>
          </div>
          <div className="risk-meter">
            <div className="risk-meter-header">
              <span>Risk Score</span>
              <strong>{lastRiskScore ?? 'N/A'}</strong>
            </div>
            <div className="risk-meter-track">
              <div className="risk-meter-fill" style={{ width: `${riskScore}%` }} />
            </div>
          </div>
          <div className="chat-shell">
            <div className="chat-window">
              {messages.length === 0 && (
                <p className="empty">No symptoms submitted yet.</p>
              )}
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`message-row ${message.sender}`}
                  style={{ '--i': index }}
                >
                  <div
                    className={`message-bubble ${message.sender} ${
                      message.sender === 'bot' ? 'card-surface' : ''
                    }`}
                  >
                    {message.text}
                    {message.sender === 'bot' && (
                      <div className="first-aid-list">
                        {getFirstAidGuides(message.text).map((guide) => (
                          <div
                            key={guide.key}
                            className="first-aid-card card-surface subtle"
                          >
                            <p className="first-aid-title">{guide.title}</p>
                            <ol className="first-aid-steps">
                              {guide.steps.map((step) => (
                                <li key={step}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <form className="chat-input" onSubmit={handleSend}>
              <input
                type="text"
                placeholder={
                  isListening ? 'Listening for symptoms...' : 'Describe symptoms'
                }
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="support-grid">
        <div className="contacts card-surface">
          <div className="contacts-header">
            <h3>Emergency Contacts</h3>
            <p>Choose the contact to call or alert.</p>
          </div>
          <div className="contacts-list">
            {contacts.length === 0 ? (
              <p className="contacts-empty">No contacts saved yet.</p>
            ) : (
              contacts.map((contact) => (
                <label key={contact.id} className="contact-card">
                  <input
                    type="radio"
                    name="emergency-contact"
                    value={contact.id}
                    checked={selectedContactId === contact.id}
                    onChange={() => setSelectedContactId(contact.id)}
                  />
                  <div>
                    <p className="contact-name">{contact.name}</p>
                    <p className="contact-phone">{contact.phone}</p>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="insurance-card card-surface">
          <div className="insurance-card-header">
            <div>
              <p className="insurance-label">Provider</p>
              <p className="insurance-value">{insuranceInfo.provider || 'N/A'}</p>
            </div>
            <div>
              <p className="insurance-label">Policy</p>
              <p className="insurance-value">
                {insuranceInfo.policyNumber || 'N/A'}
              </p>
            </div>
          </div>
          <div className="insurance-details">
            <div>
              <p className="insurance-label">Policy Holder</p>
              <p className="insurance-value">
                {insuranceInfo.policyHolder || 'N/A'}
              </p>
            </div>
            <div>
              <p className="insurance-label">Helpline</p>
              <p className="insurance-value">
                {insuranceInfo.helpline || 'N/A'}
              </p>
            </div>
          </div>
          <div className="insurance-actions">
            <a className="medical-card-btn" href={`tel:${insuranceInfo.helpline}`}>
              Call Helpline
            </a>
            <button
              type="button"
              className="medical-card-btn"
              onClick={handleShareInsurance}
            >
              Share Details
            </button>
          </div>
          {insuranceNotice && <p className="insurance-notice">{insuranceNotice}</p>}
        </div>
      </section>

      {isEmergency && isInsuranceVisible && (
        <section className="insurance-emergency">
          <h2>Insurance Details</h2>
          <div className="insurance-emergency-card card-surface">
            <div>
              <p className="insurance-label">Provider</p>
              <p className="insurance-value">{insuranceInfo.provider || 'N/A'}</p>
            </div>
            <div>
              <p className="insurance-label">Policy Number</p>
              <p className="insurance-value">
                {insuranceInfo.policyNumber || 'N/A'}
              </p>
            </div>
            <div>
              <p className="insurance-label">Policy Holder</p>
              <p className="insurance-value">
                {insuranceInfo.policyHolder || 'N/A'}
              </p>
            </div>
            <div>
              <p className="insurance-label">Helpline</p>
              <p className="insurance-value">{insuranceInfo.helpline || 'N/A'}</p>
            </div>
          </div>
        </section>
      )}

      {hospitalError && (
        <section className="hospitals card-surface">
          <p className="hospitals-error">{hospitalError}</p>
        </section>
      )}
    </div>
  )
}

export default EmergencyDashboard
