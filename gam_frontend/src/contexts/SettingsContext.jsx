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

  return (
    <SettingsContext.Provider value={{ settings, loading, reload: loadSettings }}>
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
