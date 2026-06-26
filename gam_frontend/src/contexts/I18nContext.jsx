import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import LanguagePreloader from '../components/LanguagePreloader'

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    const stored = localStorage.getItem('locale')
    if (stored) return stored

    // Auto-detect language from browser settings
    const browserLang = navigator.language || navigator.userLanguage || 'en'
    const shortLang = browserLang.split('-')[0].toLowerCase()
    return ['en', 'ar'].includes(shortLang) ? shortLang : 'en'
  })
  const [strings, setStrings] = useState({})
  const [loading, setLoading] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false)
  const [nextLocale, setNextLocale] = useState(null)

  const loadTranslations = useCallback(async (loc) => {
    try {
      const res = await api.get(`/translations/${loc}`)
      setStrings(res.data || {})
    } catch {
      setStrings({})
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadTranslations(locale)
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = locale
    localStorage.setItem('locale', locale)
  }, []) // Run once on mount

  const t = useCallback((key, fallback, replacements = {}) => {
    let text = strings[key] || fallback || key
    if (replacements && typeof replacements === 'object') {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{${k}}`, 'g'), v)
      })
    }
    return text
  }, [strings])

  const switchLocale = useCallback(async (loc) => {
    if (loc === locale || isSwitching) return
    
    setIsSwitching(true)
    setNextLocale(loc)

    // Wait 300ms for overlay fade-in animation to cover layout
    await new Promise(resolve => setTimeout(resolve, 300))

    try {
      // 1. Fetch translations for new language before flipping layout
      const res = await api.get(`/translations/${loc}`)
      
      // 2. Set strings and locale simultaneously in React state
      setStrings(res.data || {})
      setLocale(loc)
      
      // 3. Update DOM settings
      document.documentElement.dir = loc === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = loc
      localStorage.setItem('locale', loc)
      
      // 4. Wait 150ms for layout to settle behind the blurred overlay
      await new Promise(resolve => setTimeout(resolve, 150))
    } catch (err) {
      console.error('Failed to change language:', err)
    } finally {
      setIsSwitching(false)
      setNextLocale(null)
    }
  }, [locale, isSwitching])

  return (
    <I18nContext.Provider value={{ locale, t, switchLocale, loading, strings, loadTranslations, isSwitching, nextLocale }}>
      {children}
      <LanguagePreloader isVisible={isSwitching} nextLocale={nextLocale} />
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

