import React from 'react'

export default function MedicalInfo({ data, onChange }) {
  const handleChange = (field) => (e) => onChange(field, e.target.value)

  return (
    <section className="onboarding-section">
      <div className="section-heading">
        <span className="section-index">02</span>
        <div>
          <h2>Medical Information</h2>
          <p>Crucial context for emergency responders.</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label>Known Conditions</label>
          <textarea
            rows="2"
            placeholder="e.g. Asthma, Epilepsy"
            value={data.conditions}
            onChange={handleChange('conditions')}
          />
        </div>

        <div className="field">
          <label>Allergies</label>
          <textarea
            rows="2"
            placeholder="e.g. Peanuts, Penicillin"
            value={data.allergies}
            onChange={handleChange('allergies')}
          />
        </div>

        <div className="field">
          <label>Current Medications</label>
          <textarea
            rows="2"
            placeholder="e.g. Insulin, Aspirin"
            value={data.medications}
            onChange={handleChange('medications')}
          />
        </div>
      </div>
    </section>
  )
}