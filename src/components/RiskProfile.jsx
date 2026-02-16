import React from 'react'

export default function RiskProfile({ data, onChange }) {
  const handleChange = (field) => (e) => onChange(field, e.target.value)

  return (
    <section className="onboarding-section">
      <div className="section-heading">
        <span className="section-index">05</span>
        <div>
          <h2>Risk Factors</h2>
          <p>Optional: Helps AI assess severity better.</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label>Do you smoke?</label>
          <select value={data.smoker} onChange={handleChange('smoker')}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>

        <div className="field">
          <label>History of heart issues?</label>
          <select value={data.heartHistory} onChange={handleChange('heartHistory')}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
      </div>
    </section>
  )
}