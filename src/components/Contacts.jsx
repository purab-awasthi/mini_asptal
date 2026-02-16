import React from 'react'

export default function Contacts({ contacts, draft, onDraftChange, onAdd, onRemove, errors }) {
  const handleChange = (field) => (e) => onDraftChange(field, e.target.value)

  return (
    <section className="onboarding-section">
       <div className="section-heading">
        <span className="section-index">03</span>
        <div>
          <h2>Emergency Contacts</h2>
          <p>People to notify instantly.</p>
        </div>
      </div>

      <div className="contact-add">
          <input
            type="text"
            placeholder="Name"
            value={draft.name}
            onChange={handleChange('name')}
          />
          <input
            type="text"
            placeholder="Relationship"
            value={draft.relationship}
            onChange={handleChange('relationship')}
          />
          <input
            type="tel"
            placeholder="Phone"
            value={draft.phone}
            onChange={handleChange('phone')}
          />
        <button type="button" onClick={onAdd}>+ Add</button>
      </div>
      {errors.contacts && <p className="field-error">{errors.contacts}</p>}

      <div className="contact-list" style={{ marginTop: '16px' }}>
        {contacts.length === 0 ? (
          <p className="empty">No contacts added yet.</p>
        ) : (
          contacts.map((contact) => (
            <div key={contact.id} className="contact-item">
              <div>
                <p className="contact-name">{contact.name}</p>
                <p className="contact-meta">{contact.relationship} • {contact.phone}</p>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => onRemove(contact.id)}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  )
}