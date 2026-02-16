import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ✅ Components
import Header from '../components/Header'
import PersonalInfo from '../components/PersonalInfo'
import MedicalInfo from '../components/MedicalInfo'
import Contacts from '../components/Contacts'
import InsuranceInfo from '../components/InsuranceInfo'
import RiskProfile from '../components/RiskProfile'

/* --- 1. CONFIGURATION --- */

const defaultProfile = {
  personal: { fullName: '', age: '', gender: '', bloodGroup: '', phone: '' },
  medical: { conditions: '', allergies: '', medications: '', diabetes: 'no', bloodPressure: 'no' },
  contacts: [],
  insurance: { provider: '', policyNumber: '', policyHolder: '', helpline: '' },
  risk: { smoker: 'no', heartHistory: 'no' },
}

const getValue = (obj, path) => {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : ''), obj)
}

/* --- 2. MAIN COMPONENT --- */

function Onboarding() {
  const navigate = useNavigate()
  
  // ✅ STATE
  const [profile, setProfile] = useState(defaultProfile)
  const [errors, setErrors] = useState({})
  const [contactDraft, setContactDraft] = useState({ name: '', relationship: '', phone: '' })

  // --- ⚡ SKIP LOGIC (Fixed) ---
  const handleSkip = () => {
    // 1. Create a "Guest" profile satisfying ALL App.jsx checks
    const guestProfile = {
      ...defaultProfile,
      personal: { 
        fullName: 'Guest User', 
        age: '0', 
        gender: 'Prefer not to say', 
        bloodGroup: 'Unknown', // 👈 CRITICAL FIX
        phone: '0000000000' 
      },
      contacts: [
        { id: 'ems', name: 'Emergency Services', relationship: 'Service', phone: '112' }
      ]
    }

    // 2. Save Guest Data
    localStorage.setItem('profileData', JSON.stringify(guestProfile))
    localStorage.setItem('profileCompleted', 'true')
    
    // 3. Sync Legacy Keys
    localStorage.setItem('emergencyContacts', JSON.stringify(guestProfile.contacts))
    localStorage.setItem('medicalCard', JSON.stringify({ 
        data: { ...guestProfile.personal, ...guestProfile.medical } 
    }))

    // 4. Force Navigation
    navigate('/emergency', { replace: true })
  }

  // --- Progress Logic ---
  const completion = useMemo(() => {
    const textFields = [
      'personal.fullName', 'personal.age', 'personal.gender', 'personal.phone',
      'medical.conditions', 'medical.allergies', 'medical.medications',
      'insurance.provider', 'insurance.policyNumber', 'insurance.policyHolder', 'insurance.helpline'
    ]

    let points = 0
    textFields.forEach((path) => {
      const val = getValue(profile, path)
      if (val && String(val).trim().length > 0) points++
    })

    if (profile.medical.diabetes !== 'no') points++
    if (profile.medical.bloodPressure !== 'no') points++
    if (profile.risk.smoker !== 'no') points++
    if (profile.risk.heartHistory !== 'no') points++
    if (profile.contacts.length > 0) points += 3

    return Math.min(100, Math.round((points / 18) * 100))
  }, [profile])

  // --- Handlers ---
  const handleSectionChange = (section) => (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }))
    if (errors[`${section}.${field}`]) {
      setErrors((prev) => ({ ...prev, [`${section}.${field}`]: '' }))
    }
  }

  const handleContactDraftChange = (field, value) => {
    setContactDraft((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddContact = (e) => {
    e.preventDefault()
    if (!contactDraft.name.trim() || !contactDraft.phone.trim()) {
        setErrors(prev => ({...prev, contacts: "Name and Phone are required"}))
        return 
    }
    setProfile((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        { id: Date.now(), ...contactDraft },
      ],
    }))
    setContactDraft({ name: '', relationship: '', phone: '' })
    setErrors(prev => ({...prev, contacts: null}))
  }

  const handleRemoveContact = (id) => {
    setProfile((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== id),
    }))
  }

  const handleSave = () => {
    const required = ['personal.fullName', 'personal.age', 'personal.phone']
    const newErrors = {}
    required.forEach(path => {
        if(!getValue(profile, path)) newErrors[path] = 'Required'
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    
    // ✅ SAVE REAL DATA
    localStorage.setItem('profileData', JSON.stringify(profile))
    localStorage.setItem('profileCompleted', 'true')
    
    localStorage.setItem('emergencyContacts', JSON.stringify(profile.contacts))
    localStorage.setItem('medicalCard', JSON.stringify({ 
        data: { ...profile.personal, ...profile.medical } 
    }))
    localStorage.setItem('insuranceInfo', JSON.stringify(profile.insurance))

    navigate('/emergency')
  }

  return (
    <div className="app onboarding">
      <Header />

      <main style={{ paddingBottom: '140px' }}>
        <PersonalInfo 
          data={profile.personal} 
          onChange={handleSectionChange('personal')} 
          errors={errors} 
        />
        <MedicalInfo 
          data={profile.medical} 
          onChange={handleSectionChange('medical')} 
        />
        <Contacts 
          contacts={profile.contacts} 
          draft={contactDraft}
          onDraftChange={handleContactDraftChange}
          onAdd={handleAddContact}
          onRemove={handleRemoveContact}
          errors={errors} 
        />
        <InsuranceInfo 
          data={profile.insurance} 
          onChange={handleSectionChange('insurance')} 
          errors={errors} 
        />
        <RiskProfile 
          data={profile.risk} 
          onChange={handleSectionChange('risk')} 
        />
      </main>

      {/* ⚡ FLOATING DOCK */}
      <div className="bottom-dock">
        <button onClick={handleSkip} className="dock-btn secondary">Skip</button>
        
        <div className="dock-progress-wrapper">
          <span className="dock-percent">{completion}%</span>
          <div className="dock-track">
            <div className="dock-fill" style={{ width: `${completion}%` }} />
          </div>
        </div>
        
        <button onClick={handleSave} className="dock-btn primary">Save</button>
      </div>
    </div>
  )
}

export default Onboarding