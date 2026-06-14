import { useState, useEffect, useRef } from 'react'
import { useI18n } from '../contexts/I18nContext'
import { Globe, ChevronDown } from 'lucide-react'

export default function LanguageSwitcher({ style = {} }) {
  const { locale, switchLocale, t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentLanguageLabel = locale === 'ar' ? 'العربية (Arabic)' : 'English'

  const handleLanguageChange = (lang) => {
    switchLocale(lang)
    setIsOpen(false)
  }

  return (
    <div 
      className="br-lang-selector" 
      ref={dropdownRef} 
      style={{ ...style }}
    >
      <button
        type="button"
        id="language-select-dropdown"
        className={`br-lang-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: style.width ? '100%' : 'auto' }}
      >
        <Globe size={16} className="globe-icon" />
        <span className="br-lang-label-text">{currentLanguageLabel}</span>
        <ChevronDown size={14} className="chevron-icon" />
      </button>

      {isOpen && (
        <div className="br-lang-dropdown">
          <div className="br-lang-header">
            {t('language.choose', locale === 'ar' ? 'اختر اللغة' : 'Choose Language')}
          </div>
          <div className="br-lang-list">
            <button
              type="button"
              className={`br-lang-item ${locale === 'en' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en')}
            >
              English
            </button>
            <button
              type="button"
              className={`br-lang-item ${locale === 'ar' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('ar')}
            >
              العربية (Arabic)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
