import { useState, useEffect } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [edited, setEdited] = useState({})
  const [testEmailRecipient, setTestEmailRecipient] = useState('')
  const [sendingTestMail, setSendingTestMail] = useState(false)

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
      await adminApi.updateSetting(key, edited[key])
      toast.success(`Setting "${key}" saved!`)
      // Update local list
      setSettings(ss => ss.map(s => s.key === key ? { ...s, value: edited[key] } : s))
    } catch { toast.error(`Failed to save ${key}`) }
    finally { setSaving(s => ({ ...s, [key]: false })) }
  }

  const groups = [...new Set(settings.map(s => s.group))].filter(g => g !== 'system_info')
  const projectPath = settings.find(s => s.key === 'project_path')?.value || '/path-to-your-project'

  const groupIcon = { payout: '💳', gam: '📡', payment: '🏦', display: '🎨', localization: '🌍', registration: '📝', email: '📧' }

  if (loading) return (
    <div className="loading-screen"><div className="spinner"></div></div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Settings</h1>
          <p className="page-subtitle">Global platform configuration</p>
        </div>
      </div>

      {groups.map(group => (
        <div key={group} className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title">
              {groupIcon[group] || '⚙️'} {group.charAt(0).toUpperCase() + group.slice(1)} Settings
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
                  ) : s.key === 'publisher_registration_status' ? (
                    <div>
                      <select
                        className="form-select"
                        value={edited[s.key] ?? 'pending'}
                        onChange={e => setEdited(v => ({ ...v, [s.key]: e.target.value }))}
                      >
                        <option value="active">✅ Active — Publisher can log in immediately</option>
                        <option value="pending">⏳ Pending — Wait for admin approval</option>
                      </select>
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {edited[s.key] === 'pending'
                          ? '⚠️ New publishers will see a "pending review" message after registration and cannot log in until activated.'
                          : '✅ New publishers will be automatically activated and can log in right after registering.'}
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
                        ✏️ This message is shown to the publisher on the registration confirmation screen when their account requires admin approval.
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
                ⏰ Production Task Scheduler (Cron Job) Setup Instructions
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
              </div>
            </div>
          )}
          {group === 'email' && (
            <div className="alert alert-info" style={{ marginTop: 24, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🧪 Test SMTP Configuration
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
                >
                  {sendingTestMail ? '⏳ Sending…' : '📤 Send Test Email'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
