import React from 'react'

export default function InsuranceInfo({ data, onChange, errors }) {
  const handleChange = (field) => (e) => onChange(field, e.target.value)
  const getErr = (field) => errors && errors[`insurance.${field}`]

  return (
    <section className="onboarding-section">
      <div className="section-heading">
        <span className="section-index">04</span>
        <div>
          <h2>Insurance Details</h2>
          <p>Optional: Useful for hospital admission.</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          {/* 👇 UPDATED LABELS */}
          <label>Provider Name</label> 
          {/* Note: Insurance is technically optional for "Save", so I removed the * completely to avoid confusion, 
              OR if you want it required, use: <label>Provider Name <span className="req">*</span></label> */}
          <input
            type="text"
            placeholder="e.g. LIC, HDFC Ergo"
            value={data.provider}
            onChange={handleChange('provider')}
          />
          {getErr('provider') && <p className="field-error">{getErr('provider')}</p>}
        </div>

        <div className="field">
          <label>Policy Number</label>
          <input
            type="text"
            placeholder="e.g. 123456789"
            value={data.policyNumber}
            onChange={handleChange('policyNumber')}
          />
          {getErr('policyNumber') && <p className="field-error">{getErr('policyNumber')}</p>}
        </div>

        <div className="field">
          <label>Policy Holder</label>
          <input
            type="text"
            placeholder="Name on card"
            value={data.policyHolder}
            onChange={handleChange('policyHolder')}
          />
          {getErr('policyHolder') && <p className="field-error">{getErr('policyHolder')}</p>}
        </div>

        <div className="field">
          <label>Helpline Number</label>
          <input
            type="tel"
            placeholder="Emergency support #"
            value={data.helpline}
            onChange={handleChange('helpline')}
          />
          {getErr('helpline') && <p className="field-error">{getErr('helpline')}</p>}
        </div>
      </div>
    </section>
  )
}