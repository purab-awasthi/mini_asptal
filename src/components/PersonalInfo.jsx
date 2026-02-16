import React from 'react'

export default function PersonalInfo({ data, onChange, errors }) {
  const handleChange = (field) => (e) => onChange(field, e.target.value)
  const getErr = (field) => errors[`personal.${field}`]

  return (
    <section className="onboarding-section">
      <div className="section-heading">
        <span className="section-index">01</span>
        <div>
          <h2>Personal Information</h2>
          <p>Core details shown on dashboard.</p>
        </div>
      </div>
      
      <div className="form-grid">
        <div className="field">
          {/* 👇 Red Asterisk */}
          <label>Full Name <span className="req">*</span></label>
          <input
            type="text"
            value={data.fullName}
            onChange={handleChange('fullName')}
            placeholder="John Doe"
          />
          {getErr('fullName') && <span className="field-error">{getErr('fullName')}</span>}
        </div>

        <div className="field">
          <label>Age <span className="req">*</span></label>
          <input
            type="number"
            value={data.age}
            onChange={handleChange('age')}
            placeholder="e.g. 25"
          />
           {getErr('age') && <span className="field-error">{getErr('age')}</span>}
        </div>

        <div className="field">
          <label>Gender <span className="req">*</span></label>
          <select value={data.gender} onChange={handleChange('gender')}>
            <option value="">Select gender</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Non-binary">Non-binary</option>
          </select>
          {getErr('gender') && <span className="field-error">{getErr('gender')}</span>}
        </div>

        <div className="field">
          <label>Phone <span className="req">*</span></label>
          <input
            type="tel"
            value={data.phone}
            onChange={handleChange('phone')}
            placeholder="e.g. 9876543210"
          />
          {getErr('phone') && <span className="field-error">{getErr('phone')}</span>}
        </div>
      </div>
    </section>
  )
}