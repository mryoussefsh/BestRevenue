import { useState, useEffect } from 'react'
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

export default function SettingsPage() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [edited, setEdited] = useState({})
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

  async function handleSave(key) {
    setSaving(s => ({ ...s, [key]: true }))
    try {
      // payment_methods is an object when edited in our custom list editor,
      // but the API expects JSON or correct type format.
      // SettingController will handle array-to-JSON parsing but let's be safe.
      const val = edited[key]
      await adminApi.updateSetting(key, val)
      toast.success(`Setting "${key}" saved!`)
      setSettings(ss => ss.map(s => s.key === key ? { ...s, value: val } : s))
      reloadSettings()
    } catch { toast.error(`Failed to save ${key}`) }
    finally { setSaving(s => ({ ...s, [key]: false })) }
  }

  const groups = [...new Set(settings.map(s => s.group))].filter(g => g !== 'system_info')
  const projectPath = settings.find(s => s.key === 'project_path')?.value || '/path-to-your-project'

  const renderGroupIcon = (group) => {
    const icons = {
      payout: <CreditCard size={18} style={{ color: 'var(--br-primary)' }} />,
      gam: <Server size={18} style={{ color: 'var(--br-primary)' }} />,
      payment: <DollarSign size={18} style={{ color: 'var(--br-primary)' }} />,
      display: <Palette size={18} style={{ color: 'var(--br-primary)' }} />,
      localization: <Globe size={18} style={{ color: 'var(--br-primary)' }} />,
      registration: <UserPlus size={18} style={{ color: 'var(--br-primary)' }} />,
      email: <Mail size={18} style={{ color: 'var(--br-primary)' }} />,
      seo: <Search size={18} style={{ color: 'var(--br-primary)' }} />,
      support: <MessageSquare size={18} style={{ color: 'var(--br-primary)' }} />,
      social: <Share2 size={18} style={{ color: 'var(--br-primary)' }} />
    }
    return icons[group] || <Settings size={18} style={{ color: 'var(--br-primary)' }} />
  }

  if (loading) return (
    <div className="loading-screen"><div className="spinner"></div></div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={28} style={{ color: 'var(--br-primary)' }} /> Settings
          </h1>
          <p className="page-subtitle">Global platform configuration</p>
        </div>
      </div>

      {groups.map(group => (
        <div key={group} className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {renderGroupIcon(group)}
              <span>{group.charAt(0).toUpperCase() + group.slice(1)} Settings</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {settings.filter(s => s.group === group).map(s => (
              <div key={s.key} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr auto',
                gap: 16,
                alignItems: 'start',
                paddingBottom: 20,
                borderBottom: '1px solid var(--color-border)',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.label || s.key}</div>
                  <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                    <code>{s.key}</code>
                  </div>
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
                    <select
                      className="form-select"
                      value={edited[s.key] ?? 'UTC'}
                      onChange={e => setEdited(v => ({ ...v, [s.key]: e.target.value }))}
                    >
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="Africa/Cairo">Africa/Cairo</option>
                      <option value="America/New_York">America/New_York (EST/EDT)</option>
                      <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                      <option value="Asia/Dubai">Asia/Dubai</option>
                      <option value="Asia/Riyadh">Asia/Riyadh</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="Asia/Singapore">Asia/Singapore</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="Australia/Sydney">Australia/Sydney</option>
                      <option value="Europe/London">Europe/London (GMT/BST)</option>
                      <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
                      <option value="Europe/Kiev">Europe/Kiev (EET/EEST)</option>
                      <option value="Europe/Istanbul">Europe/Istanbul (TRT)</option>
                    </select>
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
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-input"
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
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                <button
                  id={`save-setting-${s.key}`}
                  className="btn btn-primary btn-sm"
                  onClick={() => handleSave(s.key)}
                  disabled={saving[s.key] || edited[s.key] === s.value}
                >
                  {saving[s.key] ? 'Saving…' : 'Save'}
                </button>
              </div>
            ))}
          </div>
          {group === 'gam' && (
            <div className="alert alert-info" style={{ marginTop: 24, padding: 20, fontSize: '13px' }}>
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
                    Go to the <strong>Cron Jobs</strong> section in your hPanel or cPanel. Select the <strong>Custom</strong> option (do not select PHP, as Custom allows passing the <code>schedule:run</code> arguments), set the frequency to <strong>every 1 minute (<code>* * * * *</code>)</strong>, and configure the command:
                  </p>
                  <pre style={{ background: 'var(--color-bg)', padding: '6px 10px', borderRadius: '4px', overflowX: 'auto', fontFamily: 'monospace' }}>
                    /usr/bin/php {projectPath}/artisan schedule:run &gt;&gt; /dev/null 2&gt;&amp;1
                  </pre>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }} className="text-xs text-muted">
                    <Info size={12} /> <em>Note: Replace <code>{projectPath}</code> with your actual absolute server directory path (usually displayed next to the PHP version in hPanel or cPanel). If the default PHP binary doesn't work, try <code>/usr/local/bin/php</code>.</em>
                  </div>
                </div>
              </div>
            </div>
          )}
          {group === 'email' && (
            <div className="alert alert-info" style={{ marginTop: 24, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={16} /> Test SMTP Configuration
              </div>
              <p style={{ fontSize: '13px', marginBottom: '12px', color: 'var(--color-text-subtle)' }}>
                Before using SMTP in production, send a test email to verify your mail server credentials.
              </p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  type="email"
                  className="form-input"
                  style={{ maxWidth: 300, fontSize: '13px' }}
                  placeholder="Recipient email address…"
                  value={testEmailRecipient}
                  onChange={e => setTestEmailRecipient(e.target.value)}
                />
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleSendTestEmail}
                  disabled={sendingTestMail || !testEmailRecipient}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {sendingTestMail ? <Clock size={14} className="spinner" /> : <Send size={14} />}
                  <span>Send Test Email</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
