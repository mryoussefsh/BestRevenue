import React from 'react'

export default function LanguagePreloader({ isVisible, nextLocale }) {
  return (
    <div className={`br-lang-preloader ${isVisible ? 'visible' : ''}`} aria-hidden={!isVisible}>
      <div className="br-lang-preloader-content">
        <div className="br-lang-preloader-spinner-wrapper">
          <div className="br-lang-preloader-spinner"></div>
          <div className="br-lang-preloader-globe">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </div>
        </div>
        <div className="br-lang-preloader-text-container">
          <div className="br-lang-preloader-text en">Switching Language...</div>
          <div className="br-lang-preloader-text ar">جاري تغيير اللغة...</div>
        </div>
      </div>
    </div>
  )
}
