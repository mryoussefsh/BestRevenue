import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(() => localStorage.getItem('locale') || 'en')
  const [strings, setStrings] = useState({})
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    loadTranslations(locale)
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = locale
    localStorage.setItem('locale', locale)
  }, [locale, loadTranslations])

  const t = useCallback((key, fallback) => {
    return strings[key] || fallback || key
  }, [strings])

  const switchLocale = useCallback((loc) => setLocale(loc), [])

  return (
    <I18nContext.Provider value={{ locale, t, switchLocale, loading, strings }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
