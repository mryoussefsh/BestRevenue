import { useState, useEffect, useRef } from 'react'
import { adminApi } from '../../api/endpoints'
import { useSettings } from '../../contexts/SettingsContext'
import toast from 'react-hot-toast'
import {
  Settings,
  CreditCard,
  Server,
  DollarSign,
  Palette,
  Globe,
  UserPlus,
  Mail,
  Search,
  MessageSquare,
  Share2,
  Trash2,
  Plus,
  Clock,
  Info,
  Send,
  CheckCircle2,
  FileText
} from 'lucide-react'

function TimezoneSelect({ value, onChange }) {
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
        tabIndex={0}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selected ? selected.label : value || 'Select Timezone...'}
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
              placeholder="Search timezone..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
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
                  background: isSelected ? 'var(--color-primary)' : (isHovered ? 'var(--color-surface-3)' : 'transparent'), 
                  borderBottom: '1px solid var(--color-border-light)',
                  color: isSelected ? 'white' : 'var(--color-text)',
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
              No timezones found
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingGroup, setSavingGroup] = useState({})
  const [edited, setEdited] = useState({})
  const [activeTab, setActiveTab] = useState('')
  const [testEmailRecipient, setTestEmailRecipient] = useState('')
  const [sendingTestMail, setSendingTestMail] = useState(false)
  const { reload: reloadSettings } = useSettings()

  async function handleFileUpload(key, file) {
    if (!file) return
    const toastId = toast.loading('Uploading file...')
    try {
      const res = await adminApi.uploadSettingFile(key, file)
      toast.success('File uploaded successfully!', { id: toastId })
      setSettings(ss => ss.map(s => s.key === key ? { ...s, value: res.data.value } : s))
      setEdited(v => ({ ...v, [key]: res.data.value }))
      reloadSettings()
    } catch (e) {
      toast.error(e.response?.data?.message || 'File upload failed.', { id: toastId })
    }
  }

  async function handleSendTestEmail() {
    if (!testEmailRecipient) return
    setSendingTestMail(true)
    try {
      const res = await adminApi.testEmailSettings(testEmailRecipient)
      toast.success(res.data?.message || 'Test email sent!')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send test email.')
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
    } catch { toast.error('Failed to load settings') }
    finally { setLoading(false) }
  }

  const getUiGroup = (s) => {
    if (['site_name', 'site_description', 'platform_timezone', 'default_currency'].includes(s.key)) {
      return 'main_settings'
    }
    if (['site_logo', 'site_favicon', 'og_image'].includes(s.key)) {
      return 'branding'
    }
    return s.group
  }

  const getUiGroupKeysOrder = (group) => {
    if (group === 'main_settings') {
      return ['site_name', 'site_description', 'platform_timezone', 'default_currency']
    }
    if (group === 'branding') {
      return ['site_logo', 'site_favicon', 'og_image']
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
      toast.success('No changes to save.')
      return
    }

    setSavingGroup(prev => ({ ...prev, [group]: true }))
    const toastId = toast.loading(`Saving ${groupLabels[group] || group} settings...`)

    try {
      await Promise.all(
        changedSettings.map(s => adminApi.updateSetting(s.key, edited[s.key]))
      )
      toast.success('Settings saved successfully!', { id: toastId })
      
      setSettings(prev => prev.map(s => {
        if (getUiGroup(s) === group) {
          return { ...s, value: edited[s.key] }
        }
        return s
      }))
      reloadSettings()
    } catch (err) {
      toast.error('Failed to save settings.', { id: toastId })
    } finally {
      setSavingGroup(prev => ({ ...prev, [group]: false }))
    }
  }

  const groupsOrder = ['main_settings', 'branding']
  const groups = [...new Set(settings.map(s => getUiGroup(s)))]
    .filter(g => g !== 'system_info')
    .sort((a, b) => {
      const idxA = groupsOrder.indexOf(a)
      const idxB = groupsOrder.indexOf(b)
      const valA = idxA === -1 ? 999 : idxA
      const valB = idxB === -1 ? 999 : idxB
      return valA - valB
    })
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
    payment: 'Payment Methods',
    registration: 'Registration Rules',
    email: 'SMTP Mail Server',
    seo: 'SEO Configuration',
    support: 'Support & Helpdesk',
    social: 'Social Media'
  }

  const renderGroupIcon = (group) => {
    const icons = {
      main_settings: <Settings size={18} />,
      branding: <Palette size={18} />,
      payout: <CreditCard size={18} />,
      gam: <Server size={18} />,
      payment: <DollarSign size={18} />,
      registration: <UserPlus size={18} />,
      email: <Mail size={18} />,
      seo: <Search size={18} />,
      support: <MessageSquare size={18} />,
      social: <Share2 size={18} />
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
            <Settings size={28} style={{ color: 'var(--color-primary)' }} /> Settings
          </h1>
          <p className="page-subtitle">Global platform configuration</p>
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
                <span style={{ flex: 1 }}>{groupLabels[g] || g.charAt(0).toUpperCase() + g.slice(1)}</span>
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
                  }} title="Unsaved changes" />
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
                  <span>{groupLabels[activeTab] || activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {(() => {
                  const filteredSettings = [...settings].filter(s => getUiGroup(s) === activeTab)
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
                    <div key={s.key} className="settings-row" style={{ gridTemplateColumns: '1fr 2fr', paddingBottom: 24, borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ paddingRight: 16 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{s.label || s.key}</div>
                    </div>
                    <div>
                      {s.key === 'gam_sync_frequency' ? (
                        <select
                          className="form-select"
                          value={edited[s.key] ?? ''}
                          onChange={e => setEdited(v => ({ ...v, [s.key]: e.target.value }))}
                        >
                          <option value="daily">Daily</option>
                          <option value="hourly">Hourly</option>
                          <option value="minutes">Every X Minutes</option>
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
                                <Trash2 size={12} /> Clear
                              </button>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              className="form-input"
                              style={{ flex: 1, minWidth: 200 }}
                              placeholder="Or paste asset URL here..."
                              value={edited[s.key] ?? ''}
                              onChange={e => setEdited(v => ({ ...v, [s.key]: e.target.value }))}
                            />
                            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap', margin: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <FileText size={14} /> Upload File
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
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
                                {list.map((m, idx) => (
                                  <div key={idx} style={{
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 8,
                                    padding: 16,
                                    background: 'var(--color-surface-2)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ fontWeight: 600, color: 'var(--color-primary-light)' }}>
                                        Method #{idx + 1}
                                      </div>
                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-xs"
                                        style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 4 }}
                                        onClick={() => {
                                          const updated = list.filter((_, i) => i !== idx)
                                          setEdited(v => ({ ...v, [s.key]: updated }))
                                        }}
                                      >
                                        <Trash2 size={12} /> Remove
                                      </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                                      <div>
                                        <label className="text-xs text-muted" style={{ marginBottom: 4, display: 'block' }}>Name</label>
                                        <input
                                          type="text"
                                          className="form-input text-sm"
                                          value={m.name ?? ''}
                                          onChange={e => {
                                            const updated = list.map((item, i) => i === idx ? { ...item, name: e.target.value } : item)
                                            setEdited(v => ({ ...v, [s.key]: updated }))
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs text-muted" style={{ marginBottom: 4, display: 'block' }}>Min Payout ($)</label>
                                        <input
                                          type="number"
                                          className="form-input text-sm"
                                          value={m.minimum ?? 0}
                                          onChange={e => {
                                            const updated = list.map((item, i) => i === idx ? { ...item, minimum: parseFloat(e.target.value) || 0 } : item)
                                            setEdited(v => ({ ...v, [s.key]: updated }))
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted" style={{ marginBottom: 4, display: 'block' }}>Guidance Text</label>
                                      <textarea
                                        rows={2}
                                        className="form-textarea text-sm"
                                        value={m.guidance ?? ''}
                                        onChange={e => {
                                          const updated = list.map((item, i) => i === idx ? { ...item, guidance: e.target.value } : item)
                                          setEdited(v => ({ ...v, [s.key]: updated }))
                                        }}
                                        placeholder="Instructions shown to the publisher..."
                                      />
                                    </div>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                  onClick={() => {
                                    const updated = [...list, { name: '', minimum: 0, guidance: '' }]
                                    setEdited(v => ({ ...v, [s.key]: updated }))
                                  }}
                                >
                                  <Plus size={14} /> Add Payment Method
                                </button>
                              </>
                            )
                          })()}
                        </div>
                      ) : s.key === 'ad_type_preselected_sizes' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
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
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
                                {adTypes.map(type => {
                                  const activeSizes = Array.isArray(sizesObj[type.key]) ? sizesObj[type.key] : []
                                  return (
                                    <div key={type.key} style={{
                                      border: '1px solid var(--color-border)',
                                      borderRadius: 8,
                                      padding: 12,
                                      background: 'var(--color-surface-2)',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 10
                                    }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--color-primary-light)', fontSize: 13 }}>
                                          {type.label} Sizes
                                        </div>
                                      </div>
                                      
                                      {/* Chips for existing sizes */}
                                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {activeSizes.length === 0 ? (
                                          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                            No preselected sizes configured
                                          </span>
                                        ) : (
                                          activeSizes.map(sz => (
                                            <div key={sz} style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 6,
                                              background: 'var(--color-surface-3)',
                                              border: '1px solid var(--color-border-light)',
                                              borderRadius: 16,
                                              padding: '3px 10px',
                                              fontSize: 12,
                                              color: 'var(--color-text)'
                                            }}>
                                              <span>{sz}</span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updatedSizes = activeSizes.filter(s => s !== sz)
                                                  const updatedObj = { ...sizesObj, [type.key]: updatedSizes }
                                                  setEdited(v => ({ ...v, [s.key]: updatedObj }))
                                                }}
                                                style={{
                                                  background: 'transparent',
                                                  border: 'none',
                                                  color: 'var(--color-danger)',
                                                  cursor: 'pointer',
                                                  fontSize: 12,
                                                  padding: 0,
                                                  display: 'flex',
                                                  alignItems: 'center'
                                                }}
                                              >
                                                ✕
                                              </button>
                                            </div>
                                          ))
                                        )}
                                      </div>

                                      {/* Add new size input */}
                                      <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                          type="text"
                                          placeholder="e.g. 300x250, Fluid, Out-of-page"
                                          className="form-input text-xs"
                                          style={{ padding: '4px 8px', height: 'auto', flex: 1 }}
                                          onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault()
                                              const val = e.currentTarget.value.trim()
                                              if (val) {
                                                const newParts = val.split(',').map(p => p.trim()).filter(Boolean)
                                                const normalizedParts = newParts.map(p => p.replace(/\u00d7/g, 'x'))
                                                const uniqueNew = normalizedParts.filter(p => !activeSizes.includes(p))
                                                if (uniqueNew.length > 0) {
                                                  const updatedSizes = [...activeSizes, ...uniqueNew]
                                                  const updatedObj = { ...sizesObj, [type.key]: updatedSizes }
                                                  setEdited(v => ({ ...v, [s.key]: updatedObj }))
                                                }
                                                e.currentTarget.value = ''
                                              }
                                            }
                                          }}
                                        />
                                        <button
                                          type="button"
                                          className="btn btn-secondary btn-xs"
                                          onClick={e => {
                                            const input = e.currentTarget.previousSibling
                                            const val = input.value.trim()
                                            if (val) {
                                              const newParts = val.split(',').map(p => p.trim()).filter(Boolean)
                                              const normalizedParts = newParts.map(p => p.replace(/\u00d7/g, 'x'))
                                              const uniqueNew = normalizedParts.filter(p => !activeSizes.includes(p))
                                              if (uniqueNew.length > 0) {
                                                const updatedSizes = [...activeSizes, ...uniqueNew]
                                                const updatedObj = { ...sizesObj, [type.key]: updatedSizes }
                                                setEdited(v => ({ ...v, [s.key]: updatedObj }))
                                              }
                                              input.value = ''
                                            }
                                          }}
                                        >
                                          Add
                                        </button>
                                      </div>
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
                          <option value="open">Open — Anyone can register</option>
                          <option value="closed">Closed — Registrations are disabled</option>
                        </select>
                      ) : s.key === 'publisher_registration_status' ? (
                        <div>
                          <select
                            className="form-select"
                            value={edited[s.key] ?? 'pending'}
                            onChange={e => setEdited(v => ({ ...v, [s.key]: e.target.value }))}
                          >
                            <option value="active">Active — Publisher can log in immediately</option>
                            <option value="pending">Pending — Wait for admin approval</option>
                          </select>
                          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
                            {edited[s.key] === 'pending'
                              ? 'New publishers will see a "pending review" message after registration and cannot log in until activated.'
                              : 'New publishers will be automatically activated and can log in right after registering.'}
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
                            placeholder="Message shown to publisher after registration when status is pending…"
                          />
                          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-text-muted)' }}>
                            This message is shown to the publisher on the registration confirmation screen when their account requires admin approval.
                          </div>
                        </div>
                      ) : s.key === 'mail_mailer' ? (
                        <select
                          className="form-select"
                          value={edited[s.key] ?? 'log'}
                          onChange={e => setEdited(v => ({ ...v, [s.key]: e.target.value }))}
                        >
                          <option value="smtp">SMTP</option>
                          <option value="log">Log (Local File)</option>
                        </select>
                      ) : s.key === 'mail_encryption' ? (
                        <select
                          className="form-select"
                          value={edited[s.key] ?? 'tls'}
                          onChange={e => setEdited(v => ({ ...v, [s.key]: e.target.value }))}
                        >
                          <option value="tls">TLS</option>
                          <option value="ssl">SSL</option>
                          <option value="none">None</option>
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
                          <option value="true">Enabled</option>
                          <option value="false">Disabled</option>
                        </select>
                      ) : (
                        <input
                          className="form-input"
                          type={s.type === 'integer' ? 'number' : 'text'}
                          disabled={s.key === 'gam_sync_interval' && edited['gam_sync_frequency'] === 'daily'}
                          placeholder={
                            s.key === 'gam_sync_interval'
                              ? edited['gam_sync_frequency'] === 'hourly'
                                ? 'Interval in hours (e.g. 1, 2, 6)'
                                : edited['gam_sync_frequency'] === 'minutes'
                                  ? 'Interval in minutes (e.g. 10, 15, 30)'
                                  : 'Not applicable for daily sync'
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

              {/* One single Save Button for the entire Active Settings Group */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--color-border)' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleSaveGroup(activeTab)}
                  disabled={savingGroup[activeTab] || !activeTabChanged}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 24px', fontSize: 14 }}
                >
                  {savingGroup[activeTab] ? (
                    <><Clock size={16} className="spinner" /> Saving...</>
                  ) : (
                    <><CheckCircle2 size={16} /> Save {groupLabels[activeTab] || activeTab} Settings</>
                  )}
                </button>
              </div>

              {/* Special informational or testing blocks per tab */}
              {activeTab === 'gam' && (
                <div className="alert alert-info" style={{ marginTop: 32, padding: 20, fontSize: '13px' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={16} /> Production Task Scheduler (Cron Job) Setup Instructions
                  </div>
                  <p style={{ marginBottom: '12px' }}>
                    Laravel's task scheduler requires a system-level trigger to execute the dynamic auto-sync settings configured above.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <strong>1. Locally (For Testing):</strong>
                      <pre style={{ background: 'var(--color-bg)', padding: '6px 10px', borderRadius: '4px', marginTop: '4px', fontFamily: 'monospace' }}>
                        php artisan schedule:work
                      </pre>
                    </div>
                    <div>
                      <strong>2. Linux Server (Production Cron):</strong>
                      <p style={{ margin: '2px 0 4px' }}>Add this entry to your server's crontab:</p>
                      <pre style={{ background: 'var(--color-bg)', padding: '6px 10px', borderRadius: '4px', overflowX: 'auto', fontFamily: 'monospace' }}>
                        * * * * * cd {projectPath} && php artisan schedule:run &gt;&gt; /dev/null 2&gt;&amp;1
                      </pre>
                    </div>
                    <div>
                      <strong>3. Windows Server (Task Scheduler):</strong>
                      <p style={{ margin: '2px 0 0' }}>
                        Create a basic task triggering every <strong>1 minute</strong> to run <code>php artisan schedule:run</code> inside the <code>{projectPath}</code> root path.
                      </p>
                    </div>
                    <div>
                      <strong>4. Shared Hosting (Hostinger, cPanel, etc.):</strong>
                      <p style={{ margin: '2px 0 4px' }}>
                        Go to the <strong>Cron Jobs</strong> section in your hPanel or cPanel. Select the <strong>Custom</strong> option, set the frequency to <strong>every 1 minute (<code>* * * * *</code>)</strong>, and configure the command:
                      </p>
                      <pre style={{ background: 'var(--color-bg)', padding: '6px 10px', borderRadius: '4px', overflowX: 'auto', fontFamily: 'monospace' }}>
                        /usr/bin/php {projectPath}/artisan schedule:run &gt;&gt; /dev/null 2&gt;&amp;1
                      </pre>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }} className="text-xs text-muted">
                        <Info size={12} /> <em>Note: Replace <code>{projectPath}</code> with your actual absolute server directory path. If the default PHP binary doesn't work, try <code>/usr/local/bin/php</code>.</em>
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
                      <span style={{ fontWeight: 700, fontSize: '15px' }}>Test SMTP Configuration</span>
                    </div>
                    <p style={{ fontSize: '13px', margin: 0, opacity: 0.9, lineHeight: 1.5 }}>
                      Before using SMTP in production, send a test email to verify your mail server credentials.
                    </p>
                    <div className="smtp-test-form" style={{ marginTop: 4 }}>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="Recipient email address…"
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
                        <span>Send Test Email</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
