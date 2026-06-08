import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { publicApi } from '../api/endpoints'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)

  const loadSettings = useCallback(async () => {
    try {
      const res = await publicApi.getSettings()
      const data = res.data || {}
      setSettings(data)

      // 1. Tab Title
      const title = data.meta_title || data.site_name || 'BestRevenue'
      document.title = title

      // 2. Favicon
      if (data.site_favicon) {
        let favicon = document.querySelector('link[rel="icon"]')
        if (!favicon) {
          favicon = document.createElement('link')
          favicon.rel = 'icon'
          document.head.appendChild(favicon)
        }
        favicon.href = data.site_favicon
      }

      // 3. Meta Tags Utility
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

      updateMetaTag('description', data.meta_description || data.site_description)
      updateMetaTag('keywords', data.meta_keywords)
      updateOgTag('og:title', data.meta_title || data.site_name)
      updateOgTag('og:description', data.meta_description || data.site_description)
      updateOgTag('og:image', data.og_image)

    } catch (e) {
      console.error('Failed to load public settings:', e)
    } finally {
      setLoading(false)
    }
  }, [])

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
      settings,
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
