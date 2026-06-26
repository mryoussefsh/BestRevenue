import { useState, useEffect, useRef, useMemo } from 'react'
import { adminApi } from '../../api/endpoints'
import { useSettings } from '../../contexts/SettingsContext'
import toast from 'react-hot-toast'
import { useI18n } from '../../contexts/I18nContext'
import { Settings, CreditCard, Server, DollarSign, Palette, Globe, UserPlus, Mail, Search, MessageSquare, Share2, Trash2, Plus, Clock, Info, Send, CheckCircle2, FileText, Activity } from 'lucide-react'

function TimezoneSelect({ value, onChange }) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [hoveredVal, setHoveredVal] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const timezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'Africa/Cairo', label: 'Africa/Cairo' },
    { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
    { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai' },
    { value: 'Asia/Riyadh', label: 'Asia/Riyadh' },
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney' },
    { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
    { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
    { value: 'Europe/Kiev', label: 'Europe/Kiev (EET/EEST)' },
    { value: 'Europe/Istanbul', label: 'Europe/Istanbul (TRT)' },
  ]

  const selected = timezones.find(tz => tz.value === value)
  const filtered = timezones.filter(tz => 
    tz.label.toLowerCase().includes(search.toLowerCase()) ||
    tz.value.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        className="form-select" 
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '38px' }} 
        onClick={() => setOpen(!open)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
        tabIndex={0}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selected ? selected.label : value || t('admin.settings.timezone.select_placeholder', 'Select Timezone...')}
        </span>
        <span style={{ 
          fontSize: 10, 
          color: 'var(--color-text-muted)',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          display: 'inline-block'
        }}>▼</span>
      </div>
      {open && (
        <div style={{ 
          position: 'absolute', 
          top: 'calc(100% + 4px)', 
          left: 0, 
          right: 0, 
          zIndex: 1000, 
          background: 'var(--color-surface-2)', 
          border: '1px solid var(--color-border-light)', 
          borderRadius: 'var(--radius-md)', 
          marginTop: 4, 
          maxHeight: 250, 
          overflow: 'auto', 
          boxShadow: 'var(--shadow-md)' 
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '6px 10px', 
            borderBottom: '1px solid var(--color-border-light)', 
            position: 'sticky', 
            top: 0, 
            background: 'var(--color-surface-2)', 
            zIndex: 11 
          }}>
            <Search size={14} style={{ color: 'var(--color-text-muted)', marginRight: 8, flexShrink: 0 }} />
            <input 
              autoFocus
              className="form-input" 
              placeholder={t('admin.settings.timezone.search_placeholder', 'Search timezone...')} 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setOpen(false)
                }
              }}
              style={{ 
                padding: '4px 8px', 
                height: '30px', 
                fontSize: '13px', 
                border: 'none', 
                background: 'transparent',
                flex: 1,
                outline: 'none',
                boxShadow: 'none'
              }}
            />
          </div>
          {filtered.map(tz => {
            const isSelected = value === tz.value
            const isHovered = hoveredVal === tz.value
            return (
              <div 
                key={tz.value} 
                style={{ 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  background: isSelected ? 'rgba(0, 242, 254, 0.15)' : (isHovered ? 'var(--color-surface-3)' : 'transparent'), 
                  borderBottom: '1px solid var(--color-border-light)',
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
                  transition: 'background 0.15s',
                  fontSize: '13px'
                }} 
                onClick={() => { onChange(tz.value); setOpen(false); setSearch('') }}
                onMouseEnter={() => setHoveredVal(tz.value)}
                onMouseLeave={() => setHoveredVal(null)}
              >
                {tz.label}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ padding: '8px 12px', color: 'var(--color-text-muted)', fontSize: 12, textAlign: 'center' }}>
              {t('admin.settings.timezone.none_found', 'No timezones found')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CopyButton({ text }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    if (!navigator.clipboard) {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        setCopied(true)
        toast.success(t('admin.settings.copy.copied_success', 'Copied to clipboard!'))
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        toast.error(t('admin.settings.copy.copied_failed', 'Failed to copy text'))
      }
      return
    }
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true)
        toast.success(t('admin.settings.copy.copied_success', 'Copied to clipboard!'))
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        toast.error(t('admin.settings.copy.copied_failed', 'Failed to copy text'))
      })
  }
  return (
    <button
      type="button"
      className="btn btn-secondary btn-xs"
      onClick={handleCopy}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        fontSize: '11px',
        height: '24px',
        background: 'var(--color-surface-3)',
        border: '1px solid var(--color-border-light)',
        flexShrink: 0
      }}
    >
      {copied ? t('admin.settings.copy.copied', 'Copied!') : t('admin.settings.copy.copy', 'Copy')}
    </button>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingGroup, setSavingGroup] = useState({})
  const [edited, setEdited] = useState({})
  const [expandedTypes, setExpandedTypes] = useState({})
  const [expandedPayments, setExpandedPayments] = useState({})
  const [newSizeInputs, setNewSizeInputs] = useState({})
  const [activeTab, setActiveTab] = useState('')
  const [testEmailRecipient, setTestEmailRecipient] = useState('')
  const [sendingTestMail, setSendingTestMail] = useState(false)
  const { reload: reloadSettings } = useSettings()
  const { t } = useI18n()

  async function handleFileUpload(key, file) {
    if (!file) return
    const toastId = toast.loading(t('admin.settings.toast.uploading', 'Uploading file...'))
    try {
      const res = await adminApi.uploadSettingFile(key, file)
      toast.success(t('admin.settings.toast.uploaded', 'File uploaded successfully!'), { id: toastId })
      setSettings(ss => ss.map(s => s.key === key ? { ...s, value: res.data.value } : s))
      setEdited(v => ({ ...v, [key]: res.data.value }))
      reloadSettings()
    } catch (e) {
      toast.error(e.response?.data?.message || t('admin.settings.toast.upload_failed', 'File upload failed.'), { id: toastId })
    }
  }

  async function handleSendTestEmail() {
    if (!testEmailRecipient) return
    setSendingTestMail(true)
    try {
      const res = await adminApi.testEmailSettings(testEmailRecipient)
      toast.success(res.data?.message || t('admin.settings.toast.test_email_sent', 'Test email sent!'))
    } catch (e) {
      toast.error(e.response?.data?.message || t('admin.settings.toast.test_email_failed', 'Failed to send test email.'))
    } finally { setSendingTestMail(false) }
  }

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await adminApi.getSettings()
      setSettings(res.data || [])
      const vals = {}
      ;(res.data || []).forEach(s => { vals[s.key] = s.value })
      setEdited(vals)
    } catch { toast.error(t('admin.settings.toast.load_failed', 'Failed to load settings')) }
    finally { setLoading(false) }
  }

  const getUiGroup = (s) => {
    if (['site_name', 'site_name_ar', 'site_description', 'site_description_ar', 'platform_timezone', 'default_currency', 'company_address', 'company_address_ar'].includes(s.key)) {
      return 'main_settings'
    }
    if (['site_logo', 'site_favicon', 'og_image'].includes(s.key)) {
      return 'branding'
    }
    if (['traffic_tracking_enabled', 'tracking_verify_frequency', 'tracking_verify_interval'].includes(s.key)) {
      return 'tracking'
    }
    return s.group
  }

  const getUiGroupKeysOrder = (group) => {
    if (group === 'main_settings') {
      return ['site_name', 'site_name_ar', 'site_description', 'site_description_ar', 'platform_timezone', 'default_currency', 'company_address', 'company_address_ar']
    }
    if (group === 'branding') {
      return ['site_logo', 'site_favicon', 'og_image']
    }
    if (group === 'gam') {
      return [
        'gam_timezone',
        'gam_sync_days_back',
        'gam_sync_frequency',
        'gam_sync_interval',
        'google_client_id',
        'google_client_secret',
        'google_redirect_uri',
        'ad_type_preselected_sizes'
      ]
    }
    if (group === 'tracking') {
      return [
        'traffic_tracking_enabled',
        'tracking_verify_frequency',
        'tracking_verify_interval'
      ]
    }
    if (group === 'seo') {
      return [
        'meta_title',
        'meta_title_ar',
        'meta_description',
        'meta_description_ar',
        'meta_keywords',
        'meta_keywords_ar'
      ]
    }
    if (group === 'registration') {
      return [
        'registration_status',
        'publisher_registration_status',
        'publisher_pending_message',
        'publisher_pending_message_ar',
        'publisher_default_ratio'
      ]
    }
    if (group === 'homepage_stats') {
      return [
        'homepage_stats_override',
        'homepage_stats_publishers',
        'homepage_stats_impressions',
        'homepage_stats_total_paid',
        'homepage_stats_websites'
      ]
    }
    if (group === 'social') {
      return [
        'social_facebook',
        'social_instagram',
        'social_x',
        'social_telegram'
      ]
    }
    return null
  }

  async function handleSaveGroup(group) {
    const groupSettings = settings.filter(s => getUiGroup(s) === group)
    const changedSettings = groupSettings.filter(s => {
      const edVal = edited[s.key]
      const originalStr = typeof s.value === 'object' || Array.isArray(s.value) ? JSON.stringify(s.value) : String(s.value ?? '')
      const editedStr = typeof edVal === 'object' || Array.isArray(edVal) ? JSON.stringify(edVal) : String(edVal ?? '')
      return originalStr !== editedStr
    })

    if (changedSettings.length === 0) {
      toast.success(t('admin.settings.toast.no_changes', 'No changes to save.'))
      return
    }

    setSavingGroup(prev => ({ ...prev, [group]: true }))
    const currentLabel = groupLabels[group] || group
    const translatedGroupLabel = t(`admin.settings.group.${group}`, currentLabel)
    const toastId = toast.loading(t('admin.settings.toast.saving_group', 'Saving {group} settings...', { group: translatedGroupLabel }))

    try {
      await Promise.all(
        changedSettings.map(s => adminApi.updateSetting(s.key, edited[s.key]))
      )
      toast.success(t('admin.settings.toast.saved', 'Settings saved successfully!'), { id: toastId })
      
      setSettings(prev => prev.map(s => {
        if (getUiGroup(s) === group) {
          return { ...s, value: edited[s.key] }
        }
        return s
      }))
      reloadSettings()
    } catch (err) {
      toast.error(t('admin.settings.toast.save_failed', 'Failed to save settings.'), { id: toastId })
    } finally {
      setSavingGroup(prev => ({ ...prev, [group]: false }))
    }
  }

  const groupsOrder = ['main_settings', 'branding', 'homepage_stats', 'gam', 'tracking']
  const groups = useMemo(() => {
    return [...new Set(settings.map(s => getUiGroup(s)))]
      .filter(g => g !== 'system_info')
      .sort((a, b) => {
        const idxA = groupsOrder.indexOf(a)
        const idxB = groupsOrder.indexOf(b)
        const valA = idxA === -1 ? 999 : idxA
        const valB = idxB === -1 ? 999 : idxB
        return valA - valB
      })
  }, [settings])
  const projectPath = settings.find(s => s.key === 'project_path')?.value || '/path-to-your-project'

  // Initialize active tab once groups are loaded
  useEffect(() => {
    if (groups.length > 0 && !activeTab) {
      setActiveTab(groups[0])
    }
  }, [settings, activeTab, groups])

  const groupLabels = {
    main_settings: 'Main Settings',
    branding: 'Branding Settings',
    payout: 'Payout Settings',
    gam: 'GAM Sync Settings',
    tracking: 'Traffic Tracking',
    payment: 'Payment Methods',
    registration: 'Registration Rules',
    email: 'SMTP Mail Server',
    seo: 'SEO Configuration',
    support: 'Support & Helpdesk',
    social: 'Social Media',
    homepage_stats: 'Homepage Statistics'
  }

  const renderGroupIcon = (group) => {
    const icons = {
      main_settings: <Settings size={18} />,
      branding: <Palette size={18} />,
      payout: <CreditCard size={18} />,
      gam: <Server size={18} />,
      tracking: <Activity size={18} />,
      payment: <DollarSign size={18} />,
      registration: <UserPlus size={18} />,
      email: <Mail size={18} />,
      seo: <Search size={18} />,
      support: <MessageSquare size={18} />,
      social: <Share2 size={18} />,
      homepage_stats: <Globe size={18} />
    }
    return icons[group] || <Settings size={18} />
  }

  if (loading) return (
    <div className="loading-screen"><div className="spinner"></div></div>
  )

  const isTabChanged = (g) => {
    return settings.filter(s => getUiGroup(s) === g).some(s => {
      const edVal = edited[s.key]
      const originalStr = typeof s.value === 'object' || Array.isArray(s.value) ? JSON.stringify(s.value) : String(s.value ?? '')
      const editedStr = typeof edVal === 'object' || Array.isArray(edVal) ? JSON.stringify(edVal) : String(edVal ?? '')
      return originalStr !== editedStr
    })
  }

  const activeTabChanged = activeTab ? isTabChanged(activeTab) : false

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={28} style={{ color: 'var(--color-primary)' }} /> {t('admin.settings.title', 'Settings')}
          </h1>
          <p className="page-subtitle">{t('admin.settings.subtitle', 'Global platform configuration')}</p>
        </div>
      </div>

      <div className="settings-layout-container">
        {/* Sidebar Navigation */}
        <div className="settings-sidebar-nav">
          {groups.map(g => {
            const isActive = activeTab === g
            const hasChanges = isTabChanged(g)

            return (
              <button
                key={g}
                type="button"
                className={`settings-tab-btn${isActive ? ' active' : ''}`}
                onClick={() => setActiveTab(g)}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {renderGroupIcon(g)}
                </span>
                <span style={{ flex: 1 }}>{t(`admin.settings.group.${g}`, groupLabels[g] || g.charAt(0).toUpperCase() + g.slice(1))}</span>
                {hasChanges && (
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#f59e0b',
                    position: 'absolute',
                    top: '50%',
                    right: 12,
                    transform: 'translateY(-50%)'
                  }} title={t('admin.settings.unsaved_changes', 'Unsaved changes')} />
                )}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="settings-tab-content">
          {activeTab && (
            <div className="card" style={{ padding: 24, marginBottom: 0 }}>
              <div className="card-header" style={{ padding: 0, paddingBottom: 16, marginBottom: 24, borderBottom: '1px solid var(--color-border)' }}>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {renderGroupIcon(activeTab)}
                  <span>{t(`admin.settings.group.${activeTab}`, groupLabels[activeTab] || activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}</span>
                </div>
              </div>

              <div className="settings-rows-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {(() => {
                  const filteredSettings = [...settings].filter(s => getUiGroup(s) === activeTab && s.key !== 'global_sync_enabled')
                  const order = getUiGroupKeysOrder(activeTab)
                  if (order) {
                    filteredSettings.sort((a, b) => {
                      const idxA = order.indexOf(a.key)
                      const idxB = order.indexOf(b.key)
                      const valA = idxA === -1 ? 999 : idxA
                      const valB = idxB === -1 ? 999 : idxB
                      return valA - valB
                    })
                  }
                  return filteredSettings.map(s => (
                    <div 
                      key={s.key} 
                      className={['ad_type_preselected_sizes', 'payment_methods'].includes(s.key) ? "settings-row-full" : "settings-row"} 
                      style={['ad_type_preselected_sizes', 'payment_methods'].includes(s.key) ? {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0,
                        paddingBottom: 24,
                        borderBottom: '1px solid var(--color-border)'
                      } : {
                        gridTemplateColumns: '1fr 2fr',
                        paddingBottom: 24,
                        borderBottom: '1px solid var(--color-border)'
                      }}
                    >
                      {s.key === 'payment_methods' ? (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>
                            {t(`admin.settings.keys.${s.key}`, (s.label || s.key).replace(/\s*\(JSON config\)/i, ''))}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                            {t('admin.settings.payment_methods.desc', 'Configure the payout methods publishers can choose from.')}
                          </div>
                        </div>
                      ) : (
                        <div style={s.key === 'ad_type_preselected_sizes' ? { width: '100%' } : { paddingRight: 16 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{t(`admin.settings.keys.${s.key}`, s.label || s.key)}</div>
                        </div>
                      )}
                      <div style={{ width: '100%' }}>
                      {['gam_sync_frequency', 'tracking_verify_frequency'].includes(s.key) ? (
                        <select
                          className="form-select"
                          value={edited[s.key] ?? ''}
                          onChange={e => setEdited(v => ({ ...v, [s.key]: e.target.value }))}
                        >
                          <option value="daily">{t('admin.settings.gam_sync_frequency.daily', 'Daily')}</option>
                          <option value="hourly">{t('admin.settings.gam_sync_frequency.hourly', 'Hourly')}</option>
                          <option value="minutes">{t('admin.settings.gam_sync_frequency.minutes', 'Every X Minutes')}</option>
                        </select>
                      ) : s.key === 'platform_timezone' ? (
                        <TimezoneSelect
                          value={edited[s.key] ?? 'UTC'}
                          onChange={val => setEdited(v => ({ ...v, [s.key]: val }))}
                        />
                      ) : ['site_logo', 'site_favicon', 'og_image'].includes(s.key) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                          {edited[s.key] && (
                            <div style={{
                              background: 'var(--color-surface-3)',
                              padding: 10,
                              borderRadius: 8,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 12,
                              border: '1px dashed var(--color-border)',
                              alignSelf: 'flex-start'
                            }}>
                              <img
                                src={edited[s.key]}
                                alt={s.label}
                                style={{
                                  maxHeight: s.key === 'site_favicon' ? 32 : 50,
                                  maxWidth: 150,
                                  objectFit: 'contain',
                                  borderRadius: 4
                                }}
                              />
                              <button
                                type="button"
                                className="btn btn-secondary btn-xs"
                                onClick={() => {
                                  setEdited(v => ({ ...v, [s.key]: '' }))
                                }}
                                style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 4 }}
                              >
                                <Trash2 size={12} /> {t('admin.settings.clear', 'Clear')}
                              </button>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              className="form-input"
                              style={{ flex: 1, minWidth: 200 }}
                              placeholder={t('admin.settings.asset_url_placeholder', 'Or paste asset URL here...')}
                              value={edited[s.key] ?? ''}
                              onChange={e => setEdited(v => ({ ...v, [s.key]: e.target.value }))}
                            />
                            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap', margin: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <FileText size={14} /> {t('admin.settings.upload_file', 'Upload File')}
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={e => {
                                  const file = e.target.files?.[0]
                                  if (file) handleFileUpload(s.key, file)
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      ) : s.key === 'payment_methods' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                          {(() => {
                            let list = []
                            try {
                              list = typeof edited[s.key] === 'string' ? JSON.parse(edited[s.key]) : edited[s.key]
                            } catch {
                              list = []
                            }
                            if (!Array.isArray(list)) list = []

                            return (
                              <>
                                {list.map((m, idx) => {
                                  const isOpen = !!expandedPayments[idx]
                                  const hasName = m.name && m.name.trim()
                                  return (
                                    <div
                                      key={idx}
                                      className={`pm-card ${isOpen ? 'expanded' : 'collapsed'}`}
                                      onClick={!isOpen ? () => setExpandedPayments(p => ({ ...p, [idx]: true })) : undefined}
                                    >
                                      {/* Card Header */}
                                      <div
                                        className="pm-card-header"
                                        style={{ cursor: 'pointer', userSelect: 'none' }}
                                        onClick={(e) => {
                                          if (isOpen) {
                                            e.stopPropagation()
                                            setExpandedPayments(p => ({ ...p, [idx]: false }))
                                          }
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                          <span style={{
                                            fontSize: 10,
                                            color: 'var(--color-text-muted)',
                                            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s',
                                            display: 'inline-block',
                                            flexShrink: 0
                                          }}>▶</span>
                                          <span className="pm-card-title">
                                            {hasName ? (m.name + (m.name_ar ? ` (${m.name_ar})` : '')) : t('admin.settings.payment_methods.method_number', 'Method #{number}', { number: idx + 1 })}
                                          </span>
                                          {!isOpen && (
                                            <span style={{
                                              fontSize: '11px',
                                              color: 'var(--color-text-muted)',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                              opacity: 0.7,
                                              paddingLeft: 4
                                            }}>
                                              {m.minimum != null ? t('admin.settings.payment_methods.min_amount', 'min ${amount}', { amount: m.minimum }) : ''}
                                              {m.guidance ? ` · ${m.guidance.slice(0, 40)}${m.guidance.length > 40 ? '…' : ''}` : ''}
                                            </span>
                                          )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                          <span className="pm-card-badge">{t('admin.settings.payment_methods.number_badge', '#{number}', { number: idx + 1 })}</span>
                                          <button
                                            type="button"
                                            className="pm-card-remove"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              const updated = list.filter((_, i) => i !== idx)
                                              setEdited(v => ({ ...v, [s.key]: updated }))
                                              setExpandedPayments(p => {
                                                const next = {}
                                                Object.entries(p).forEach(([k, v]) => {
                                                  const ki = parseInt(k)
                                                  if (ki < idx) next[ki] = v
                                                  else if (ki > idx) next[ki - 1] = v
                                                })
                                                return next
                                              })
                                            }}
                                          >
                                            <Trash2 size={12} />
                                            {t('admin.settings.payment_methods.remove', 'Remove')}
                                          </button>
                                        </div>
                                      </div>
 
                                      {/* Expanded Body */}
                                      {isOpen && (
                                        <div className="pm-card-body" onClick={e => e.stopPropagation()}>
                                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                                            <div>
                                              <label className="pm-field-label">{t('admin.settings.payment_methods.fields.name', 'Payment Name (English)')}</label>
                                              <input
                                                type="text"
                                                className="form-input"
                                                style={{ fontSize: 13 }}
                                                placeholder={t('admin.settings.payment_methods.fields.name_placeholder', 'e.g. Bank Transfer, PayPal…')}
                                                value={m.name ?? ''}
                                                onChange={e => {
                                                  const updated = list.map((item, i) => i === idx ? { ...item, name: e.target.value } : item)
                                                  setEdited(v => ({ ...v, [s.key]: updated }))
                                                }}
                                              />
                                            </div>
                                            <div>
                                              <label className="pm-field-label">{t('admin.settings.payment_methods.fields.name_ar', 'Payment Name (Arabic)')}</label>
                                              <input
                                                type="text"
                                                className="form-input"
                                                style={{ fontSize: 13 }}
                                                dir="rtl"
                                                placeholder={t('admin.settings.payment_methods.fields.name_ar_placeholder', 'e.g. تحويل بنكي، بايبال…')}
                                                value={m.name_ar ?? ''}
                                                onChange={e => {
                                                  const updated = list.map((item, i) => i === idx ? { ...item, name_ar: e.target.value } : item)
                                                  setEdited(v => ({ ...v, [s.key]: updated }))
                                                }}
                                              />
                                            </div>
                                            <div>
                                              <label className="pm-field-label">{t('admin.settings.payment_methods.fields.min_payout', 'Min Payout ($)')}</label>
                                              <input
                                                type="number"
                                                className="form-input"
                                                style={{ fontSize: 13 }}
                                                placeholder={t('admin.settings.payment_methods.fields.min_payout_placeholder', 'e.g. 50')}
                                                value={m.minimum ?? 0}
                                                onChange={e => {
                                                  const updated = list.map((item, i) => i === idx ? { ...item, minimum: parseFloat(e.target.value) || 0 } : item)
                                                  setEdited(v => ({ ...v, [s.key]: updated }))
                                                }}
                                              />
                                            </div>
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
                                            <div>
                                              <label className="pm-field-label">{t('admin.settings.payment_methods.fields.guidance', 'Guidance Text (English)')}</label>
                                              <textarea
                                                rows={4}
                                                className="form-textarea"
                                                style={{ fontSize: 14, resize: 'vertical', minHeight: 100 }}
                                                value={m.guidance ?? ''}
                                                onChange={e => {
                                                  const updated = list.map((item, i) => i === idx ? { ...item, guidance: e.target.value } : item)
                                                  setEdited(v => ({ ...v, [s.key]: updated }))
                                                }}
                                                placeholder={t('admin.settings.payment_methods.fields.guidance_placeholder', 'Instructions shown to the publisher when selecting this method…')}
                                              />
                                            </div>
                                            <div>
                                              <label className="pm-field-label">{t('admin.settings.payment_methods.fields.guidance_ar', 'Guidance Text (Arabic)')}</label>
                                              <textarea
                                                rows={4}
                                                className="form-textarea"
                                                style={{ fontSize: 14, resize: 'vertical', minHeight: 100 }}
                                                dir="rtl"
                                                value={m.guidance_ar ?? ''}
                                                onChange={e => {
                                                  const updated = list.map((item, i) => i === idx ? { ...item, guidance_ar: e.target.value } : item)
                                                  setEdited(v => ({ ...v, [s.key]: updated }))
                                                }}
                                                placeholder={t('admin.settings.payment_methods.fields.guidance_ar_placeholder', 'Instructions shown in Arabic…')}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                                <button
                                  type="button"
                                  className="pm-add-btn"
                                  onClick={() => {
                                    const newIdx = list.length
                                    const updated = [...list, { name: '', minimum: 0, guidance: '' }]
                                    setEdited(v => ({ ...v, [s.key]: updated }))
                                    setExpandedPayments(p => ({ ...p, [newIdx]: true }))
                                  }}
                                >
                                  <Plus size={16} /> {t('admin.settings.payment_methods.add_btn', 'Add Payment Method')}
                                </button>
                              </>
                            )
                          })()}
                        </div>
                      ) : s.key === 'ad_type_preselected_sizes' ? (
                        <div style={{ width: '100%' }}>
                          {(() => {
                            let sizesObj = {}
                            try {
                              sizesObj = typeof edited[s.key] === 'string' ? JSON.parse(edited[s.key]) : edited[s.key]
                            } catch {
                              sizesObj = {}
                            }
                            if (!sizesObj || typeof sizesObj !== 'object') sizesObj = {}

                            const adTypes = [
                              { key: 'banner', label: 'Banner' },
                              { key: 'reward', label: 'Reward' },
                              { key: 'interstitial', label: 'Interstitial' },
                              { key: 'anchor', label: 'Anchor' },
                              { key: 'float_top', label: 'Float Top' },
                              { key: 'float_bottom', label: 'Float Bottom' },
                              { key: 'float_fullscreen', label: 'Float Full Screen' },
                            ]

                            return (
                              <div className="gam-sizes-grid">
                                {adTypes.map(type => {
                                  const activeSizes = Array.isArray(sizesObj[type.key]) ? sizesObj[type.key] : []
                                  const isExpanded = expandedTypes[type.key]

                                  return (
                                    <div 
                                      key={type.key} 
                                      className={`gam-size-card ${isExpanded ? 'expanded' : 'collapsed'}`}
                                      onClick={!isExpanded ? () => setExpandedTypes(prev => ({ ...prev, [type.key]: true })) : undefined}
                                    >
                                      <div 
                                        className="gam-size-card-header"
                                        style={{ cursor: 'pointer', userSelect: 'none' }}
                                        onClick={(e) => {
                                          if (isExpanded) {
                                            e.stopPropagation()
                                            setExpandedTypes(prev => ({ ...prev, [type.key]: false }))
                                          }
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                          <span style={{ 
                                            fontSize: 10, 
                                            color: 'var(--color-text-muted)',
                                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s',
                                            display: 'inline-block',
                                            marginRight: 2,
                                            flexShrink: 0
                                          }}>▶</span>
                                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                            <span className="gam-size-card-title">{t('admin.settings.gam_sizes.card_title', '{type} Sizes', { type: t(`admin.settings.gam_sizes.types.${type.key}`, type.label) })}</span>
                                            {!isExpanded && activeSizes.length > 0 && (
                                              <span 
                                                style={{ 
                                                  fontSize: '11px', 
                                                  color: 'var(--color-text-muted)', 
                                                  overflow: 'hidden', 
                                                  textOverflow: 'ellipsis', 
                                                  whiteSpace: 'nowrap',
                                                  fontFamily: 'monospace',
                                                  opacity: 0.7,
                                                  marginTop: 2
                                                }}
                                                title={activeSizes.join(', ')}
                                              >
                                                ({activeSizes.join(', ')})
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <span className="gam-size-card-badge">{activeSizes.length}</span>
                                      </div>
                                      
                                      {isExpanded && (
                                        <>
                                          <div className="gam-size-card-body">
                                            {/* Chips for existing sizes */}
                                            <div className="gam-size-chips-container">
                                              {activeSizes.length === 0 ? (
                                                <span className="gam-size-empty">
                                                  {t('admin.settings.gam_sizes.empty', 'No preselected sizes configured')}
                                                </span>
                                              ) : (
                                                activeSizes.map(sz => (
                                                  <div key={sz} className="gam-size-chip">
                                                    <span>{sz}</span>
                                                    <button
                                                      type="button"
                                                      className="gam-size-chip-delete"
                                                      onClick={(e) => {
                                                        e.stopPropagation()
                                                        const updatedSizes = activeSizes.filter(s => s !== sz)
                                                        const updatedObj = { ...sizesObj, [type.key]: updatedSizes }
                                                        setEdited(v => ({ ...v, [s.key]: updatedObj }))
                                                      }}
                                                    >
                                                      ✕
                                                    </button>
                                                  </div>
                                                ))
                                              )}
                                            </div>
                                          </div>

                                          {/* Add new size input */}
                                          <div className="gam-size-card-footer" onClick={e => e.stopPropagation()}>
                                            <div className="gam-size-input-wrapper">
                                              <input
                                                type="text"
                                                placeholder={t('admin.settings.gam_sizes.input_placeholder', 'Add size (e.g. 300x250)...')}
                                                className="form-input gam-size-input"
                                                value={newSizeInputs[type.key] || ''}
                                                onChange={e => {
                                                  const val = e.target.value
                                                  setNewSizeInputs(prev => ({ ...prev, [type.key]: val }))
                                                }}
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    const val = (newSizeInputs[type.key] || '').trim()
                                                    if (val) {
                                                      const newParts = val.split(',').map(p => p.trim()).filter(Boolean)
                                                      const normalizedParts = newParts.map(p => p.replace(/\u00d7/g, 'x'))
                                                      const uniqueNew = normalizedParts.filter(p => !activeSizes.includes(p))
                                                      if (uniqueNew.length > 0) {
                                                        const updatedSizes = [...activeSizes, ...uniqueNew]
                                                        const updatedObj = { ...sizesObj, [type.key]: updatedSizes }
                                                        setEdited(v => ({ ...v, [s.key]: updatedObj }))
                                                      }
                                                      setNewSizeInputs(prev => ({ ...prev, [type.key]: '' }))
                                                    }
                                                  }
                                                }}
                                              />
                                              <button
                                                type="button"
                                                className="btn btn-primary btn-xs gam-size-add-btn"
                                                onClick={() => {
                                                  const val = (newSizeInputs[type.key] || '').trim()
                                                  if (val) {
                                                    const newParts = val.split(',').map(p => p.trim()).filter(Boolean)
                                                    const normalizedParts = newParts.map(p => p.replace(/\u00d7/g, 'x'))
                                                    const uniqueNew = normalizedParts.filter(p => !activeSizes.includes(p))
                                                    if (uniqueNew.length > 0) {
                                                      const updatedSizes = [...activeSizes, ...uniqueNew]
                                                      const updatedObj = { ...sizesObj, [type.key]: updatedSizes }
                                                      setEdited(v => ({ ...v, [s.key]: updatedObj }))
                                                    }
                                                    setNewSizeInputs(prev => ({ ...prev, [type.key]: '' }))
                                                  }
                                                }}
                                              >
                                                {t('admin.settings.gam_sizes.add_btn', 'Add')}
                                              </button>
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })()}
                        </div>
                      ) : s.key === 'registration_status' ? (
                        <select
                          className="form-select"
                          value={edited[s.key] ?? 'open'}
                          onChange={e => setEdited(v => ({ ...v, [s.key]: e.target.value }))}
                        >
                          <option value="open">{t('admin.settings.registration_status.open', 'Open — Anyone can register')}</option>
                          <option value="closed">{t('admin.settings.registration_status.closed', 'Closed — Registrations are disabled')}</option>
                        </select>
                      ) : s.key === 'publisher_registration_status' ? (
                        <div>
                          <select
                            className="form-select"
                            value={edited[s.key] ?? 'pending'}
                            onChange={e => setEdited(v => ({ ...v, [s.key]: e.target.value }))}
                          >
                            <option value="active">{t('admin.settings.publisher_registration_status.active', 'Active — Publisher can log in immediately')}</option>
                            <option value="pending">{t('admin.settings.publisher_registration_status.pending', 'Pending — Wait for admin approval')}</option>
                          </select>
                          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
                            {edited[s.key] === 'pending'
                              ? t('admin.settings.publisher_registration_status.pending_help', 'New publishers will see a "pending review" message after registration and cannot log in until activated.')
                              : t('admin.settings.publisher_registration_status.active_help', 'New publishers will be automatically activated and can log in right after registering.')}
                          </div>
                        </div>
                      ) : s.key === 'publisher_pending_message' ? (
                        <div>
                          <textarea
                            className="form-textarea"
                            rows={4}
                            style={{ resize: 'vertical', minHeight: 80 }}
                            value={edited[s.key] ?? ''}
                            onChange={e => setEdited(v => ({ ...v, [s.key]: e.target.value }))}
                            placeholder={t('admin.settings.publisher_pending_message.placeholder', 'Message shown to publisher after registration when status is pending…')}
                          />
                          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-text-muted)' }}>
                            {t('admin.settings.publisher_pending_message.help', 'This message is shown to the publisher on the registration confirmation screen when their account requires admin approval.')}
                          </div>
                        </div>
                      ) : s.key === 'publisher_pending_message_ar' ? (
                        <div>
                          <textarea
                            className="form-textarea"
                            rows={4}
                            dir="rtl"
                            style={{ resize: 'vertical', minHeight: 80, textAlign: 'right' }}
                            value={edited[s.key] ?? ''}
                            onChange={e => setEdited(v => ({ ...v, [s.key]: e.target.value }))}
                            placeholder={t('admin.settings.publisher_pending_message_ar.placeholder', 'الرسالة المعروضة للناشر بعد التسجيل عندما تكون الحالة معلقة (بالعربي)...')}
                          />
                          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-text-muted)' }}>
                            {t('admin.settings.publisher_pending_message_ar.help', 'تظهر هذه الرسالة للناشر في شاشة تأكيد التسجيل عندما يتطلب حسابه موافقة المسؤول (النسخة العربية).')}
                          </div>
                        </div>
                      ) : s.key === 'mail_mailer' ? (
                        <select
                          className="form-select"
                          value={edited[s.key] ?? 'log'}
                          onChange={e => setEdited(v => ({ ...v, [s.key]: e.target.value }))}
                        >
                          <option value="smtp">{t('admin.settings.mail_mailer.smtp', 'SMTP')}</option>
                          <option value="log">{t('admin.settings.mail_mailer.log', 'Log (Local File)')}</option>
                        </select>
                      ) : s.key === 'mail_encryption' ? (
                        <select
                          className="form-select"
                          value={edited[s.key] ?? 'tls'}
                          onChange={e => setEdited(v => ({ ...v, [s.key]: e.target.value }))}
                        >
                          <option value="tls">TLS</option>
                          <option value="ssl">SSL</option>
                          <option value="none">{t('admin.settings.mail_encryption.none', 'None')}</option>
                        </select>
                      ) : s.key === 'mail_password' ? (
                        <input
                          className="form-input"
                          type="password"
                          placeholder="••••••••"
                          value={edited[s.key] ?? ''}
                          onChange={e => setEdited(v => ({ ...v, [s.key]: e.target.value }))}
                        />
                      ) : s.type === 'boolean' ? (
                        <select
                          className="form-select"
                          value={edited[s.key]}
                          onChange={e => setEdited(v => ({ ...v, [s.key]: e.target.value }))}
                        >
                          <option value="true">{t('admin.settings.status.enabled', 'Enabled')}</option>
                          <option value="false">{t('admin.settings.status.disabled', 'Disabled')}</option>
                        </select>
                      ) : s.key === 'google_redirect_uri' ? (
                        <div style={{ display: 'flex', gap: 10, width: '100%', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="form-input"
                            style={{ flex: 1, background: 'var(--color-surface-3)', cursor: 'default' }}
                            readOnly
                            value={edited[s.key] ?? ''}
                          />
                          <CopyButton text={edited[s.key] ?? ''} />
                        </div>
                      ) : (
                        <input
                          className="form-input"
                          type={s.type === 'integer' ? 'number' : 'text'}
                          disabled={
                             (s.key === 'gam_sync_interval' && edited['gam_sync_frequency'] === 'daily') ||
                             (s.key === 'tracking_verify_interval' && edited['tracking_verify_frequency'] === 'daily')
                           }
                           placeholder={
                             ['gam_sync_interval', 'tracking_verify_interval'].includes(s.key)
                               ? (s.key === 'gam_sync_interval' ? edited['gam_sync_frequency'] : edited['tracking_verify_frequency']) === 'hourly'
                                 ? t('admin.settings.gam_sync_interval.hourly_placeholder', 'Interval in hours (e.g. 1, 2, 6)')
                                 : (s.key === 'gam_sync_interval' ? edited['gam_sync_frequency'] : edited['tracking_verify_frequency']) === 'minutes'
                                   ? t('admin.settings.gam_sync_interval.minutes_placeholder', 'Interval in minutes (e.g. 10, 15, 30)')
                                   : t('admin.settings.gam_sync_interval.daily_placeholder', 'Not applicable for daily sync')
                               : ''
                           }
                          value={edited[s.key] ?? ''}
                          onChange={e => setEdited(v => ({ ...v, [s.key]: e.target.value }))}
                        />
                      )}
                    </div>
                  </div>
                ))
              })()}
              </div>



              {/* Special informational or testing blocks per tab */}
              {activeTab === 'gam' && (
                <div className="alert alert-info" style={{ marginTop: 32, padding: 24, display: 'block' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{
                        background: 'rgba(99,102,241,0.15)',
                        padding: '8px',
                        borderRadius: '6px',
                        color: 'var(--color-primary, #6366f1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Clock size={18} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '15px' }}>{t('admin.settings.cron.title', 'Production Task Scheduler (Cron Job) Setup')}</span>
                    </div>

                    <p style={{ fontSize: '13px', margin: 0, opacity: 0.9, lineHeight: 1.5 }}>
                      {t('admin.settings.cron.desc', "Laravel's task scheduler requires a system-level trigger to execute the dynamic auto-sync settings configured above in production. Configure one of the following methods:")}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {/* Linux Server Cron */}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13.5px', marginBottom: 4 }}>
                          {t('admin.settings.cron.linux_title', '1. Linux Server (Production Cron)')}
                        </div>
                        <p style={{ margin: '0 0 6px', fontSize: '12.5px', opacity: 0.8 }}>
                          {t('admin.settings.cron.linux_desc', "Add this entry to your server's crontab:")}
                        </p>
                        <div style={{ 
                          background: 'var(--color-bg)', 
                          padding: '8px 12px', 
                          borderRadius: '6px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          gap: 12,
                          border: '1px solid var(--color-border-light)'
                        }}>
                          <code style={{ 
                            fontFamily: 'monospace', 
                            fontSize: '12px', 
                            color: 'var(--color-text)',
                            whiteSpace: 'nowrap',
                            overflowX: 'auto',
                            flex: 1,
                            paddingBottom: '2px'
                          }}>
                            * * * * * cd {projectPath} && php artisan schedule:run &gt;&gt; /dev/null 2&gt;&amp;1
                          </code>
                          <CopyButton text={`* * * * * cd ${projectPath} && php artisan schedule:run >> /dev/null 2>&1`} />
                        </div>
                      </div>

                      {/* Shared Hosting Cron */}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13.5px', marginBottom: 4 }}>
                          {t('admin.settings.cron.shared_title', '2. Shared Hosting (Hostinger, cPanel, etc.)')}
                        </div>
                        <p style={{ margin: '0 0 6px', fontSize: '12.5px', opacity: 0.8 }}>
                          {t('admin.settings.cron.shared_desc_1', 'Go to the')} <strong>{t('admin.settings.cron.shared_desc_2', 'Cron Jobs')}</strong> {t('admin.settings.cron.shared_desc_3', 'section in your hosting control panel. Select the')} <strong>{t('admin.settings.cron.shared_desc_4', 'Custom')}</strong> {t('admin.settings.cron.shared_desc_5', 'option, set the frequency to')} <strong>{t('admin.settings.cron.shared_desc_6', 'every 1 minute ( * * * * * )')}</strong>{t('admin.settings.cron.shared_desc_7', ', and configure the command:')}
                        </p>
                        <div style={{ 
                          background: 'var(--color-bg)', 
                          padding: '8px 12px', 
                          borderRadius: '6px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          gap: 12,
                          border: '1px solid var(--color-border-light)'
                        }}>
                          <code style={{ 
                            fontFamily: 'monospace', 
                            fontSize: '12px', 
                            color: 'var(--color-text)',
                            whiteSpace: 'nowrap',
                            overflowX: 'auto',
                            flex: 1,
                            paddingBottom: '2px'
                          }}>
                            /usr/bin/php {projectPath}/artisan schedule:run &gt;&gt; /dev/null 2&gt;&amp;1
                          </code>
                          <CopyButton text={`/usr/bin/php ${projectPath}/artisan schedule:run >> /dev/null 2>&1`} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 8, wordBreak: 'break-word', overflowWrap: 'anywhere' }} className="text-xs text-muted">
                          <Info size={12} style={{ flexShrink: 0, marginTop: 2 }} /> 
                          <em>{t('admin.settings.cron.note', 'Note: Replace {projectPath} with your actual absolute server directory path. If the default PHP binary doesn\'t work, try /usr/local/bin/php.', { projectPath })}</em>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="alert alert-info" style={{ marginTop: 32, padding: 24, display: 'block' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{
                        background: 'rgba(99,102,241,0.15)',
                        padding: '8px',
                        borderRadius: '6px',
                        color: 'var(--color-primary, #6366f1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Mail size={18} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '15px' }}>{t('admin.settings.email_test.title', 'Test SMTP Configuration')}</span>
                    </div>
                    <p style={{ fontSize: '13px', margin: 0, opacity: 0.9, lineHeight: 1.5 }}>
                      {t('admin.settings.email_test.desc', 'Before using SMTP in production, send a test email to verify your mail server credentials.')}
                    </p>
                    <div className="smtp-test-form" style={{ marginTop: 4 }}>
                      <input
                        type="email"
                        className="form-input"
                        placeholder={t('admin.settings.email_test.placeholder', 'Recipient email address…')}
                        value={testEmailRecipient}
                        onChange={e => setTestEmailRecipient(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleSendTestEmail}
                        disabled={sendingTestMail || !testEmailRecipient}
                      >
                        {sendingTestMail ? <Clock size={14} className="spinner" /> : <Send size={14} />}
                        <span>{t('admin.settings.email_test.send_btn', 'Send Test Email')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* One single Save Button for the entire Active Settings Group */}
              <div className="settings-save-bar">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleSaveGroup(activeTab)}
                  disabled={savingGroup[activeTab] || !activeTabChanged}
                >
                  {savingGroup[activeTab] ? (
                    <><Clock size={16} className="spinner" /> {t('admin.settings.saving', 'Saving...')}</>
                  ) : (
                    <><CheckCircle2 size={16} /> {t('admin.settings.save_group_btn', 'Save {group} Settings', {
                      group: t(`admin.settings.group.${activeTab}`, groupLabels[activeTab] || activeTab.charAt(0).toUpperCase() + activeTab.slice(1))
                    })}</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
