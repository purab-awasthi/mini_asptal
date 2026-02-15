import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const defaultProfile = {
  personal: {
    fullName: '',
    age: '',
    gender: '',
    bloodGroup: '',
    phone: '',
  },
  medical: {
    conditions: '',
    allergies: '',
    medications: '',
    diabetes: 'no',
    bloodPressure: 'no',
  },
  contacts: [],
  insurance: {
    provider: '',
    policyNumber: '',
    policyHolder: '',
    helpline: '',
  },
  risk: {
    smoker: 'no',
    heartHistory: 'no',
  },
}

const safeParse = (value, fallback) => {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const buildProfileFromLegacy = () => {
  const medicalCard = safeParse(localStorage.getItem('medicalCard'), null)
  const contacts = safeParse(localStorage.getItem('emergencyContacts'), [])
  const insurance = safeParse(localStorage.getItem('insuranceInfo'), null)

  const cardData = medicalCard?.data || medicalCard || {}

  return {
    personal: {
      fullName: cardData.fullName || '',
      age: '',
      gender: '',
      bloodGroup: cardData.bloodGroup || '',
      phone: '',
    },
    medical: {
      conditions: cardData.conditions || '',
      allergies: cardData.allergies || '',
      medications: cardData.medications || '',
      diabetes: 'no',
      bloodPressure: 'no',
    },
    contacts: Array.isArray(contacts)
      ? contacts.map((contact) => ({
          id: contact.id || `${Date.now()}-${Math.random()}`,
          name: contact.name || '',
          relationship: contact.relationship || '',
          phone: contact.phone || '',
        }))
      : [],
    insurance: {
      provider: insurance?.provider || '',
      policyNumber: insurance?.policyNumber || '',
      policyHolder: insurance?.policyHolder || '',
      helpline: insurance?.helpline || '',
    },
    risk: {
      smoker: 'no',
      heartHistory: 'no',
    },
  }
}

const loadProfile = () => {
  const stored = safeParse(localStorage.getItem('profileData'), null)
  if (stored && typeof stored === 'object') {
    return {
      ...defaultProfile,
      ...stored,
      personal: { ...defaultProfile.personal, ...stored.personal },
      medical: { ...defaultProfile.medical, ...stored.medical },
      insurance: { ...defaultProfile.insurance, ...stored.insurance },
      risk: { ...defaultProfile.risk, ...stored.risk },
      contacts: Array.isArray(stored.contacts) ? stored.contacts : [],
    }
  }

  return buildProfileFromLegacy()
}

const mapProfileToLegacy = (profile) => {
  const primaryContact = profile.contacts[0]
  const medicalCard = {
    fullName: profile.personal.fullName,
    bloodGroup: profile.personal.bloodGroup,
    allergies: profile.medical.allergies,
    medications: profile.medical.medications,
    conditions: profile.medical.conditions,
    emergencyContact: primaryContact
      ? `${primaryContact.name} (${primaryContact.phone})`
      : '',
    insurance: profile.insurance.provider,
  }

  const existingInsurance = safeParse(localStorage.getItem('insuranceInfo'), {})

  const insuranceInfo = {
    ...existingInsurance,
    provider: profile.insurance.provider,
    policyNumber: profile.insurance.policyNumber,
    policyHolder: profile.insurance.policyHolder,
    helpline: profile.insurance.helpline,
  }

  const contacts = profile.contacts.map((contact) => ({
    id: contact.id || `${Date.now()}-${Math.random()}`,
    name: contact.name,
    phone: contact.phone,
    relationship: contact.relationship,
  }))

  return { medicalCard, insuranceInfo, contacts }
}

const requiredFields = [
  ['personal.fullName', 'Full name'],
  ['personal.age', 'Age'],
  ['personal.gender', 'Gender'],
  ['personal.bloodGroup', 'Blood group'],
  ['personal.phone', 'Phone number'],
  ['insurance.provider', 'Insurance provider'],
  ['insurance.policyNumber', 'Policy number'],
  ['insurance.policyHolder', 'Policy holder name'],
  ['insurance.helpline', 'Helpline number'],
]

const getValue = (profile, path) => {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : ''), profile)
}

const validateProfile = (profile) => {
  const errors = {}

  requiredFields.forEach(([path, label]) => {
    const value = getValue(profile, path)
    if (!String(value || '').trim()) {
      errors[path] = `${label} is required.`
    }
  })

  if (!profile.contacts.length) {
    errors.contacts = 'Add at least one emergency contact.'
  } else {
    profile.contacts.forEach((contact, index) => {
      if (!contact.name.trim()) {
        errors[`contacts.${index}.name`] = 'Contact name is required.'
      }
      if (!contact.relationship.trim()) {
        errors[`contacts.${index}.relationship`] = 'Relationship is required.'
      }
      if (!contact.phone.trim()) {
        errors[`contacts.${index}.phone`] = 'Contact phone is required.'
      }
    })
  }

  return errors
}

function Onboarding() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(loadProfile)
  const [errors, setErrors] = useState({})
  const [contactDraft, setContactDraft] = useState({
    name: '',
    relationship: '',
    phone: '',
  })

  useEffect(() => {
    localStorage.setItem('profileData', JSON.stringify(profile))
    const legacy = mapProfileToLegacy(profile)
    localStorage.setItem(
      'medicalCard',
      JSON.stringify({ data: legacy.medicalCard, locked: true }),
    )
    localStorage.setItem('emergencyContacts', JSON.stringify(legacy.contacts))
    localStorage.setItem('insuranceInfo', JSON.stringify(legacy.insuranceInfo))
  }, [profile])

  const completion = useMemo(() => {
    let filled = 0
    requiredFields.forEach(([path]) => {
      if (String(getValue(profile, path) || '').trim()) filled += 1
    })
    if (profile.contacts.length) filled += 1

    const total = requiredFields.length + 1
    return Math.round((filled / total) * 100)
  }, [profile])

  const handleFieldChange = (section, field) => (event) => {
    const value = event.target.value
    setProfile((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
    if (errors[`${section}.${field}`]) {
      setErrors((prev) => ({ ...prev, [`${section}.${field}`]: '' }))
    }
  }

  const handleContactDraftChange = (field) => (event) => {
    const value = event.target.value
    setContactDraft((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddContact = (event) => {
    event.preventDefault()
    if (
      !contactDraft.name.trim() ||
      !contactDraft.relationship.trim() ||
      !contactDraft.phone.trim()
    ) {
      setErrors((prev) => ({
        ...prev,
        contacts: 'Fill name, relationship, and phone to add a contact.',
      }))
      return
    }

    setProfile((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          id: `${Date.now()}-${Math.random()}`,
          name: contactDraft.name.trim(),
          relationship: contactDraft.relationship.trim(),
          phone: contactDraft.phone.trim(),
        },
      ],
    }))

    setContactDraft({ name: '', relationship: '', phone: '' })
    if (errors.contacts) {
      setErrors((prev) => ({ ...prev, contacts: '' }))
    }
  }

  const handleRemoveContact = (id) => {
    setProfile((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((contact) => contact.id !== id),
    }))
  }

  const handleSave = () => {
    const validationErrors = validateProfile(profile)
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      return
    }

    localStorage.setItem('profileCompleted', 'true')
    navigate('/emergency')
  }

  const getError = (path) => errors[path]

  return (
    <div className="app onboarding">
      <header className="onboarding-header">
        <div>
          <p className="onboarding-title">Emergency Profile Setup</p>
          <p className="onboarding-subtitle">
            Complete this once. Your details stay on this device for quick access
            during emergencies.
          </p>
        </div>
        <div className="progress-card">
          <p className="progress-label">Profile completion</p>
          <p className="progress-value">{completion}%</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </header>

      <section className="onboarding-section card-surface">
        <div className="section-heading">
          <span className="section-index">01</span>
          <div>
            <h2>Personal Information</h2>
            <p>Core details shown on your emergency dashboard.</p>
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Full Name *</label>
            <input
              type="text"
              value={profile.personal.fullName}
              onChange={handleFieldChange('personal', 'fullName')}
              placeholder="Full name"
            />
            {getError('personal.fullName') && (
              <span className="field-error">{getError('personal.fullName')}</span>
            )}
          </div>
          <div className="field">
            <label>Age *</label>
            <input
              type="number"
              min="0"
              value={profile.personal.age}
              onChange={handleFieldChange('personal', 'age')}
              placeholder="Age"
            />
            {getError('personal.age') && (
              <span className="field-error">{getError('personal.age')}</span>
            )}
          </div>
          <div className="field">
            <label>Gender *</label>
            <select
              value={profile.personal.gender}
              onChange={handleFieldChange('personal', 'gender')}
            >
              <option value="">Select gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
            {getError('personal.gender') && (
              <span className="field-error">{getError('personal.gender')}</span>
            )}
          </div>
          <div className="field">
            <label>Blood Group *</label>
            <input
              type="text"
              value={profile.personal.bloodGroup}
              onChange={handleFieldChange('personal', 'bloodGroup')}
              placeholder="Blood group"
            />
            {getError('personal.bloodGroup') && (
              <span className="field-error">
                {getError('personal.bloodGroup')}
              </span>
            )}
          </div>
          <div className="field">
            <label>Phone Number *</label>
            <input
              type="tel"
              value={profile.personal.phone}
              onChange={handleFieldChange('personal', 'phone')}
              placeholder="Phone number"
            />
            {getError('personal.phone') && (
              <span className="field-error">{getError('personal.phone')}</span>
            )}
          </div>
        </div>
      </section>

      <section className="onboarding-section card-surface">
        <div className="section-heading">
          <span className="section-index">02</span>
          <div>
            <h2>Medical Information</h2>
            <p>Helpful context for triage and emergency responders.</p>
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Known Conditions</label>
            <textarea
              rows="2"
              value={profile.medical.conditions}
              onChange={handleFieldChange('medical', 'conditions')}
              placeholder="Condition list"
            />
          </div>
          <div className="field">
            <label>Allergies</label>
            <textarea
              rows="2"
              value={profile.medical.allergies}
              onChange={handleFieldChange('medical', 'allergies')}
              placeholder="Allergies"
            />
          </div>
          <div className="field">
            <label>Current Medications</label>
            <textarea
              rows="2"
              value={profile.medical.medications}
              onChange={handleFieldChange('medical', 'medications')}
              placeholder="Medications"
            />
          </div>
          <div className="field">
            <label>Diabetes</label>
            <select
              value={profile.medical.diabetes}
              onChange={handleFieldChange('medical', 'diabetes')}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="field">
            <label>Blood Pressure</label>
            <select
              value={profile.medical.bloodPressure}
              onChange={handleFieldChange('medical', 'bloodPressure')}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>
      </section>

      <section className="onboarding-section card-surface">
        <div className="section-heading">
          <span className="section-index">03</span>
          <div>
            <h2>Emergency Contacts</h2>
            <p>Add one or more contacts to notify during emergencies.</p>
          </div>
        </div>
        <form className="contact-add" onSubmit={handleAddContact}>
          <input
            type="text"
            placeholder="Contact name"
            value={contactDraft.name}
            onChange={handleContactDraftChange('name')}
          />
          <input
            type="text"
            placeholder="Relationship"
            value={contactDraft.relationship}
            onChange={handleContactDraftChange('relationship')}
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={contactDraft.phone}
            onChange={handleContactDraftChange('phone')}
          />
          <button type="submit">Add Contact</button>
        </form>
        {errors.contacts && (
          <span className="field-error">{errors.contacts}</span>
        )}
        <div className="contact-list">
          {profile.contacts.length === 0 ? (
            <p className="empty">No contacts added yet.</p>
          ) : (
            profile.contacts.map((contact, index) => (
              <div key={contact.id} className="contact-item">
                <div>
                  <p className="contact-name">{contact.name}</p>
                  <p className="contact-meta">
                    {contact.relationship} · {contact.phone}
                  </p>
                  {(getError(`contacts.${index}.name`) ||
                    getError(`contacts.${index}.relationship`) ||
                    getError(`contacts.${index}.phone`)) && (
                    <span className="field-error">
                      Please complete this contact.
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => handleRemoveContact(contact.id)}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="onboarding-section card-surface">
        <div className="section-heading">
          <span className="section-index">04</span>
          <div>
            <h2>Insurance Information</h2>
            <p>Keep details handy for quick verification.</p>
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Insurance Provider *</label>
            <input
              type="text"
              value={profile.insurance.provider}
              onChange={handleFieldChange('insurance', 'provider')}
              placeholder="Provider"
            />
            {getError('insurance.provider') && (
              <span className="field-error">{getError('insurance.provider')}</span>
            )}
          </div>
          <div className="field">
            <label>Policy Number *</label>
            <input
              type="text"
              value={profile.insurance.policyNumber}
              onChange={handleFieldChange('insurance', 'policyNumber')}
              placeholder="Policy number"
            />
            {getError('insurance.policyNumber') && (
              <span className="field-error">
                {getError('insurance.policyNumber')}
              </span>
            )}
          </div>
          <div className="field">
            <label>Policy Holder Name *</label>
            <input
              type="text"
              value={profile.insurance.policyHolder}
              onChange={handleFieldChange('insurance', 'policyHolder')}
              placeholder="Policy holder"
            />
            {getError('insurance.policyHolder') && (
              <span className="field-error">
                {getError('insurance.policyHolder')}
              </span>
            )}
          </div>
          <div className="field">
            <label>Helpline Number *</label>
            <input
              type="tel"
              value={profile.insurance.helpline}
              onChange={handleFieldChange('insurance', 'helpline')}
              placeholder="Helpline number"
            />
            {getError('insurance.helpline') && (
              <span className="field-error">
                {getError('insurance.helpline')}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="onboarding-section card-surface">
        <div className="section-heading">
          <span className="section-index">05</span>
          <div>
            <h2>Health Risk Profile</h2>
            <p>Optional indicators used for triage context.</p>
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Smoker</label>
            <select
              value={profile.risk.smoker}
              onChange={handleFieldChange('risk', 'smoker')}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="field">
            <label>Heart history</label>
            <select
              value={profile.risk.heartHistory}
              onChange={handleFieldChange('risk', 'heartHistory')}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>
      </section>

      <div className="onboarding-actions">
        <button type="button" className="primary-action" onClick={handleSave}>
          Save & Continue
        </button>
      </div>
    </div>
  )
}

export default Onboarding
