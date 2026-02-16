import React from 'react'

export default function Header() {
  return (
    <header className="onboarding-header">
      {/* 1. Brand Icon (Centered) */}
      <div className="header-brand-icon">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className="brand-svg"
        >
          <path d="M11.25 4.53l-6.72 3.36a2 2 0 00-1.03 1.57v4.61c0 4.15 2.62 7.89 6.46 9.2a2 2 0 001.28 0c3.84-1.31 6.46-5.05 6.46-9.2v-4.6a2 2 0 00-1.03-1.58l-6.72-3.36a2 2 0 00-1.78 0z" />
          <path fillRule="evenodd" d="M12 7.5a.75.75 0 01.75.75v3h3a.75.75 0 010 1.5h-3v3a.75.75 0 01-1.5 0v-3h-3a.75.75 0 010-1.5h3v-3A.75.75 0 0112 7.5z" clipRule="evenodd" />
        </svg>
      </div>

      {/* 2. Text Content (Centered) */}
      <h1 className="onboarding-title">Emergency Profile</h1>
      
      <p className="header-description">
        Setup your vital info for AI assessment. Details are encrypted locally and only shared when you trigger an emergency.
      </p>
      
      {/* 3. Privacy Badge (Centered) */}
      <div className="privacy-badge">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="privacy-icon">
          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
        </svg>
        <span className="onboarding-subtitle">Offline & Secure on Device</span>
      </div>
    </header>
  )
}