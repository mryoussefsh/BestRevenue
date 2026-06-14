import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { publicApi } from '../api/endpoints'
import { useI18n } from './I18nContext'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const { locale } = useI18n()

  const localizedSettings = useMemo(() => {
    if (!settings) return {}
    const isAr = locale === 'ar'
    return {
      ...settings,
      site_name: (isAr && settings.site_name_ar) ? settings.site_name_ar : (settings.site_name || 'BestRevenue'),
      site_description: (isAr && settings.site_description_ar) ? settings.site_description_ar : (settings.site_description || ''),
      meta_title: (isAr && settings.meta_title_ar) ? settings.meta_title_ar : (settings.meta_title || settings.site_name || 'BestRevenue'),
      meta_description: (isAr && settings.meta_description_ar) ? settings.meta_description_ar : (settings.meta_description || settings.site_description || ''),
      meta_keywords: (isAr && settings.meta_keywords_ar) ? settings.meta_keywords_ar : (settings.meta_keywords || ''),
      publisher_pending_message: (isAr && settings.publisher_pending_message_ar) ? settings.publisher_pending_message_ar : (settings.publisher_pending_message || ''),
    }
  }, [settings, locale])

  const loadSettings = useCallback(async () => {
    try {
      const res = await publicApi.getSettings()
      const data = res.data || {}
      setSettings(data)
    } catch (e) {
      console.error('Failed to load public settings:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (Object.keys(localizedSettings).length === 0) return

    // 1. Tab Title
    document.title = localizedSettings.meta_title

    // 2. Favicon
    if (localizedSettings.site_favicon) {
      let favicon = document.querySelector('link[rel="icon"]')
      if (!favicon) {
        favicon = document.createElement('link')
        favicon.rel = 'icon'
        document.head.appendChild(favicon)
      }
      favicon.href = localizedSettings.site_favicon
    }

    // 3. Meta Tags
    const updateMetaTag = (name, content) => {
      if (!content) return
      let meta = document.querySelector(`meta[name="${name}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = name
        document.head.appendChild(meta)
      }
      meta.content = content
    }

    const updateOgTag = (property, content) => {
      if (!content) return
      let meta = document.querySelector(`meta[property="${property}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('property', property)
        document.head.appendChild(meta)
      }
      meta.content = content
    }

    updateMetaTag('description', localizedSettings.meta_description)
    updateMetaTag('keywords', localizedSettings.meta_keywords)
    updateOgTag('og:title', localizedSettings.meta_title)
    updateOgTag('og:description', localizedSettings.meta_description)
    updateOgTag('og:image', localizedSettings.og_image)
  }, [localizedSettings])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return ''
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr
    }
    try {
      const timezone = settings.platform_timezone || 'UTC'
      const d = new Date(dateStr)
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      const parts = formatter.formatToParts(d)
      const getPart = (type) => parts.find(p => p.type === type)?.value || '00'
      const year = parts.find(p => p.type === 'year')?.value || ''
      const month = getPart('month')
      const day = getPart('day')
      return `${year}-${month}-${day}`
    } catch (e) {
      console.error(e)
      return dateStr?.slice(0, 10)
    }
  }, [settings.platform_timezone])

  const formatDateTime = useCallback((dateStr, includeSeconds = false) => {
    if (!dateStr) return ''
    try {
      const timezone = settings.platform_timezone || 'UTC'
      const d = new Date(dateStr)
      const options = {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }
      if (includeSeconds) {
        options.second = '2-digit'
      }
      const formatter = new Intl.DateTimeFormat('en-US', options)
      const parts = formatter.formatToParts(d)
      const getPart = (type) => parts.find(p => p.type === type)?.value || '00'
      const year = parts.find(p => p.type === 'year')?.value || ''
      const month = getPart('month')
      const day = getPart('day')
      const hour = getPart('hour')
      const minute = getPart('minute')
      if (includeSeconds) {
        const second = getPart('second')
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`
      }
      return `${year}-${month}-${day} ${hour}:${minute}`
    } catch (e) {
      console.error(e)
      return dateStr?.slice(0, includeSeconds ? 19 : 16).replace('T', ' ')
    }
  }, [settings.platform_timezone])

  const formatDateTimeLocal = useCallback((dateStr) => {
    if (!dateStr) return ''
    try {
      const timezone = settings.platform_timezone || 'UTC'
      const d = new Date(dateStr)
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      const parts = formatter.formatToParts(d)
      const getPart = (type) => parts.find(p => p.type === type)?.value || '00'
      const year = parts.find(p => p.type === 'year')?.value || ''
      const month = getPart('month')
      const day = getPart('day')
      const hour = getPart('hour')
      const minute = getPart('minute')
      return `${year}-${month}-${day}T${hour}:${minute}`
    } catch (e) {
      console.error(e)
      return dateStr?.slice(0, 16)
    }
  }, [settings.platform_timezone])

  return (
    <SettingsContext.Provider value={{
      settings: localizedSettings,
      rawSettings: settings,
      loading,
      reload: loadSettings,
      formatDate,
      formatDateTime,
      formatDateTimeLocal
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
