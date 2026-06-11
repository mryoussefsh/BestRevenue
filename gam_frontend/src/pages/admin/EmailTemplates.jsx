import { useState, useEffect, useRef } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { Mail, Send, RotateCcw, Save, Edit2, Eye, Paperclip } from 'lucide-react'

const VARIABLES = [
  { key: '{{ name }}',              desc: 'Publisher full name' },
  { key: '{{ email }}',             desc: 'Publisher email address' },
  { key: '{{ site_name }}',         desc: 'Platform name from settings' },
  { key: '{{ period }}',            desc: 'Billing period (e.g. 2025-05)' },
  { key: '{{ amount }}',            desc: 'Dollar amount (e.g. $250.00)' },
  { key: '{{ payment_method }}',    desc: 'Payment method (e.g. PayPal)' },
  { key: '{{ payment_reference }}', desc: 'Payment transaction reference' },
  { key: '{{ admin_note }}',        desc: 'Admin rejection/note message' },
  { key: '{{ reset_link }}',        desc: 'Password reset URL (password_reset only)' },
  { key: '{{ login_url }}',         desc: 'Login page URL' },
  { key: '{{ dashboard_url }}',     desc: 'Publisher dashboard URL' },
]

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [selectedKey, setSelectedKey] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [form, setForm] = useState({ subject: '', body: '' })
  const [previewTab, setPreviewTab] = useState('edit') // 'edit' | 'preview'
  const bodyRef = useRef()

  useEffect(() => { loadTemplates() }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const res = await adminApi.getEmailTemplates()
      setTemplates(res.data || [])
      if (res.data?.length > 0) {
        selectTemplate(res.data[0])
      }
    } catch { toast.error('Failed to load email templates') }
    finally { setLoading(false) }
  }

  function selectTemplate(t) {
    setSelectedKey(t.key)
    setForm({ subject: t.subject, body: t.body })
    setPreviewTab('edit')
  }

  const selected = templates.find(t => t.key === selectedKey)
  const isDirty = selected && (form.subject !== selected.subject || form.body !== selected.body)

  async function handleSave() {
    setSaving(true)
    try {
      await adminApi.updateEmailTemplate(selectedKey, form)
      setTemplates(ts => ts.map(t => t.key === selectedKey
        ? { ...t, subject: form.subject, body: form.body, is_customized: true }
        : t
      ))
      toast.success('Template saved!')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save template.')
    } finally { setSaving(false) }
  }

  async function handlePreview() {
    setPreviewing(true)
    try {
      const res = await adminApi.previewEmailTemplate(selectedKey)
      toast.success(res.data?.message || 'Preview sent!')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send preview.')
    } finally { setPreviewing(false) }
  }

  async function handleReset() {
    if (!confirm('Reset this template to the default? Your custom changes will be lost.')) return
    setResetting(true)
    try {
      const res = await adminApi.resetEmailTemplate(selectedKey)
      const { default_subject, default_body } = res.data
      setForm({ subject: default_subject, body: default_body })
      setTemplates(ts => ts.map(t => t.key === selectedKey
        ? { ...t, subject: default_subject, body: default_body, is_customized: false }
        : t
      ))
      toast.success('Reset to default.')
    } catch (e) {
      toast.error('Failed to reset template.')
    } finally { setResetting(false) }
  }

  function insertVariable(v) {
    const el = bodyRef.current
    if (!el) {
      setForm(f => ({ ...f, body: f.body + v }))
      return
    }
    const start = el.selectionStart
    const end   = el.selectionEnd
    const newBody = form.body.substring(0, start) + v + form.body.substring(end)
    setForm(f => ({ ...f, body: newBody }))
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + v.length, start + v.length)
    }, 0)
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={28} style={{ color: 'var(--br-primary)' }} />
            <span>Email Templates</span>
          </h1>
          <p className="page-subtitle">Customize the subject and content of all system emails</p>
        </div>
      </div>

      <div className="profile-grid" style={{ gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left: Template list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', fontWeight: 700, fontSize: 13, color: 'var(--color-text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Email Templates
          </div>
          {templates.map(t => (
            <button
              key={t.key}
              id={`tpl-${t.key}`}
              onClick={() => selectTemplate(t)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '12px 16px', border: 'none', cursor: 'pointer',
                borderLeft: selectedKey === t.key ? '3px solid var(--color-primary)' : '3px solid transparent',
                background: selectedKey === t.key ? 'rgba(99,102,241,0.08)' : 'transparent',
                textAlign: 'left', transition: 'background 0.15s',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: selectedKey === t.key ? 'var(--color-primary)' : 'var(--color-text)' }}>
                  {t.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                  {t.key}
                </div>
              </div>
              {t.is_customized && (
                <span style={{ fontSize: 9, background: 'var(--color-primary)', color: '#fff', padding: '2px 6px', borderRadius: 8, fontWeight: 700, letterSpacing: '0.5px', flexShrink: 0 }}>
                  CUSTOM
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right: Editor */}
        {selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'monospace', marginTop: 2 }}>{selected.key}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    id="btn-preview-email"
                    className="btn btn-secondary btn-sm"
                    onClick={handlePreview}
                    disabled={previewing}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {previewing ? 'Sending…' : <><Send size={14} /> Send Test Email</>}
                  </button>
                  {selected.is_customized && (
                    <button
                      id="btn-reset-template"
                      className="btn btn-secondary btn-sm"
                      onClick={handleReset}
                      disabled={resetting}
                      style={{ color: 'var(--color-warning)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      {resetting ? 'Resetting…' : <><RotateCcw size={14} /> Reset Default</>}
                    </button>
                  )}
                  <button
                    id="btn-save-template"
                    className="btn btn-primary btn-sm"
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {saving ? 'Saving…' : <><Save size={14} /> Save Template</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Subject */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Subject Line</div>
              </div>
              <input
                id="template-subject"
                className="form-input"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Email subject…"
              />
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>
                Supports variables like <code>{'{{ name }}'}</code>, <code>{'{{ site_name }}'}</code>, <code>{'{{ period }}'}</code>
              </div>
            </div>

            {/* Body editor */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Email Body (HTML)</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className={`btn btn-xs ${previewTab==='edit' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPreviewTab('edit')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Edit2 size={12} /> Edit</button>
                  <button className={`btn btn-xs ${previewTab==='preview' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPreviewTab('preview')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Eye size={12} /> Preview</button>
                </div>
              </div>

              {previewTab === 'edit' ? (
                <textarea
                  ref={bodyRef}
                  id="template-body"
                  className="form-textarea"
                  rows={18}
                  style={{ fontFamily: 'monospace', fontSize: 13, resize: 'vertical', minHeight: 300 }}
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Enter HTML body…"
                />
              ) : (
                <div style={{
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 24,
                  minHeight: 300, background: '#fff', color: '#1a1a2e',
                  fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: 15, lineHeight: 1.7,
                }}>
                  <div dangerouslySetInnerHTML={{ __html: form.body }} />
                </div>
              )}
            </div>

            {/* Variables helper */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Paperclip size={18} style={{ color: 'var(--br-primary)' }} />
                  <span>Available Variables</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Click to insert at cursor position</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {VARIABLES.map(v => (
                  <button
                    key={v.key}
                    title={v.desc}
                    className="btn btn-xs btn-secondary"
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                    onClick={() => insertVariable(v.key)}
                  >
                    {v.key}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {VARIABLES.map(v => (
                  <div key={v.key} style={{ fontSize: 12, display: 'flex', gap: 8 }}>
                    <code style={{ color: 'var(--color-primary)', flexShrink: 0 }}>{v.key}</code>
                    <span style={{ color: 'var(--color-text-muted)' }}>{v.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Select a template from the left to edit it.
          </div>
        )}
      </div>
    </div>
  )
}
