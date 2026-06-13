import { useState, useEffect, useRef, useCallback } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { useSettings } from '../../contexts/SettingsContext'
import { Megaphone, Check, X, Trash2, Edit2, Save, Send, Calendar, Users, Globe, Play, Plus } from 'lucide-react'

// Lightweight built-in rich text editor (no external deps)
function RichEditor({ value, onChange }) {
  const editorRef = useRef(null)
  const isInternalUpdate = useRef(false)

  // Sync value into contentEditable when value changes externally
  useEffect(() => {
    if (!editorRef.current) return
    if (isInternalUpdate.current) { isInternalUpdate.current = false; return }
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const handleInput = useCallback(() => {
    isInternalUpdate.current = true
    onChange(editorRef.current?.innerHTML || '')
  }, [onChange])

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
    handleInput()
  }

  const toolbarBtns = [
    { label: '<b>B</b>',  cmd: 'bold',          title: 'Bold' },
    { label: '<i>I</i>',  cmd: 'italic',         title: 'Italic' },
    { label: '<u>U</u>',  cmd: 'underline',      title: 'Underline' },
    { label: 'H1',        cmd: 'formatBlock',    val: 'h2', title: 'Heading' },
    { label: '≡',         cmd: 'insertUnorderedList', title: 'Bullet List' },
    { label: '1.',        cmd: 'insertOrderedList',   title: 'Numbered List' },
    { label: '🔗',        cmd: null,             title: 'Link', special: 'link' },
    { label: '✕',         cmd: 'removeFormat',   title: 'Clear Formatting' },
  ]

  function handleLink() {
    const url = prompt('Enter URL:')
    if (url) exec('createLink', url)
  }

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 2, padding: '6px 8px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
        {toolbarBtns.map(btn => (
          <button
            key={btn.title}
            type="button"
            title={btn.title}
            onMouseDown={e => { e.preventDefault(); btn.special === 'link' ? handleLink() : exec(btn.cmd, btn.val) }}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              color: 'var(--color-text)',
              cursor: 'pointer',
              padding: '3px 9px',
              fontSize: 13,
              fontWeight: btn.cmd === 'bold' ? 700 : 400,
              minWidth: 30
            }}
            dangerouslySetInnerHTML={{ __html: btn.label }}
          />
        ))}
      </div>
      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        style={{
          minHeight: 140,
          padding: '12px 16px',
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          fontSize: 14,
          lineHeight: 1.7,
          outline: 'none',
        }}
      />
    </div>
  )
}

const EMPTY_FORM = {
  title: '',
  content: '',
  type: 'banner',
  style: 'info',
  priority: 0,
  is_active: true,
  start_date: '',
  end_date: '',
  allow_dismiss: true,
  buttons: [],
  target_type: 'all',
  target_publishers: [],
  target_countries: [],
  target_roles: [],
}

const TYPE_COLORS = { banner: '#6366f1', modal: '#10b981' }
const TYPE_LABELS = { banner: 'Fixed Banner', modal: 'Modal Popup' }

const STYLE_COLORS = {
  info: 'var(--br-primary)',
  success: 'var(--br-accent)',
  warning: 'var(--br-warning)',
  danger: 'var(--br-danger)'
}

const STYLE_LABELS = {
  info: 'Info (Blue)',
  success: 'Success (Green)',
  warning: 'Warning (Amber)',
  danger: 'Alert (Red)'
}

export default function AdminAnnouncements() {
  const { formatDate, formatDateTimeLocal } = useSettings()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await adminApi.getAnnouncements()
      setItems(res.data?.data || [])
    } catch {
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(item) {
    setEditing(item.id)
    setForm({
      title: item.title || '',
      content: item.content || '',
      type: item.type || 'banner',
      style: item.style || 'info',
      priority: item.priority ?? 0,
      is_active: item.is_active ?? true,
      start_date: item.start_date ? formatDateTimeLocal(item.start_date) : '',
      end_date: item.end_date ? formatDateTimeLocal(item.end_date) : '',
      allow_dismiss: item.allow_dismiss ?? true,
      buttons: item.buttons || [],
      target_type: item.target_type || 'all',
      target_publishers: item.target_publishers || [],
      target_countries: item.target_countries || [],
      target_roles: item.target_roles || [],
    })
    setShowForm(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        priority: parseInt(form.priority) || 0,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      }
      if (editing) {
        await adminApi.updateAnnouncement(editing, payload)
        toast.success('Announcement updated')
      } else {
        await adminApi.createAnnouncement(payload)
        toast.success('Announcement created')
      }
      setShowForm(false)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this announcement?')) return
    setDeleting(id)
    try {
      await adminApi.deleteAnnouncement(id)
      toast.success('Deleted')
      loadData()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  // Button management helpers
  function addButton() {
    setForm(f => ({ ...f, buttons: [...f.buttons, { text: '', url: '', new_tab: true }] }))
  }
  function updateButton(idx, field, val) {
    setForm(f => ({
      ...f,
      buttons: f.buttons.map((b, i) => i === idx ? { ...b, [field]: val } : b)
    }))
  }
  function removeButton(idx) {
    setForm(f => ({ ...f, buttons: f.buttons.filter((_, i) => i !== idx) }))
  }

  // Publisher search tag input
  function PublisherTagInput({ value, onChange }) {
    const [input, setInput] = useState('')
    const [allPublishers, setAllPublishers] = useState([])
    const [focused, setFocused] = useState(false)

    useEffect(() => {
      adminApi.getPublishers().then(res => setAllPublishers(res.data?.data || []))
    }, [])

    const available = allPublishers.filter(p => !value.includes(p.id) && (p.name.toLowerCase().includes(input.toLowerCase()) || p.email.toLowerCase().includes(input.toLowerCase())))

    function addPub(pub) {
      if (!value.includes(pub.id)) onChange([...value, pub.id])
      setInput('')
      setFocused(false)
    }

    return (
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 8, background: 'var(--color-surface)', position: 'relative' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: value.length ? 8 : 0 }}>
          {value.map(id => {
            const pub = allPublishers.find(p => p.id === id)
            return (
              <span key={id} style={{
                background: 'var(--color-primary)', color: '#fff',
                borderRadius: 20, padding: '2px 10px', fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 4
              }}>
                {pub ? `${pub.name} (${pub.email})` : 'Loading...'}
                <button type="button" onClick={() => onChange(value.filter(t => t !== id))}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, fontSize: 14 }}>×</button>
              </span>
            )
          })}
        </div>
        <div style={{ position: 'relative' }}>
          <input
            className="form-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            placeholder="Search publisher by name or email…"
            style={{ width: '100%', height: 36, fontSize: 13 }}
          />
          {focused && available.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, maxHeight: 200, overflowY: 'auto', zIndex: 10, marginTop: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
              {available.map(pub => (
                <div key={pub.id} onClick={() => addPub(pub)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{pub.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{pub.email}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Generic tag input for countries/roles
  function TagInput({ value, onChange, placeholder }) {
    const [input, setInput] = useState('')
    function addTag() {
      const tag = input.trim()
      if (tag && !value.includes(tag)) onChange([...value, tag])
      setInput('')
    }
    return (
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 8, background: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: value.length ? 8 : 0 }}>
          {value.map(tag => (
            <span key={tag} style={{
              background: 'var(--color-primary)', color: '#fff',
              borderRadius: 20, padding: '2px 10px', fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 4
            }}>
              {tag}
              <button type="button" onClick={() => onChange(value.filter(t => t !== tag))}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, fontSize: 14 }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            className="form-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
            placeholder={placeholder}
            style={{ flex: 1, height: 36, fontSize: 13 }}
          />
          <button type="button" className="btn btn-secondary" style={{ padding: '0 12px', height: 36, fontSize: 13 }} onClick={addTag}>Add</button>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="loading-screen"><div className="spinner" /><span>Loading announcements…</span></div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Megaphone size={28} style={{ color: 'var(--br-primary)' }} />
            <span>Announcements</span>
          </h1>
          <p className="page-subtitle">Manage banners and modal popups for publishers</p>
        </div>
        <button className="btn btn-primary" id="create-announcement-btn" onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: items.length, color: 'var(--color-primary)' },
          { label: 'Active', value: items.filter(i => i.is_active).length, color: 'var(--color-success)' },
          { label: 'Banners', value: items.filter(i => i.type === 'banner').length, color: '#6366f1' },
          { label: 'Modals', value: items.filter(i => i.type === 'modal').length, color: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 12, padding: '12px 20px', flex: '1 1 120px', minWidth: 100
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Megaphone size={40} /></div>
          <div className="empty-state-text">No announcements yet</div>
          <div className="empty-state-sub">Click "New Announcement" to create one</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Target</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Schedule</th>
                <th>Views</th>
                <th>Clicks</th>
                <th>Dismissals</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, maxWidth: 180 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{
                        background: `${TYPE_COLORS[item.type]}22`,
                        color: TYPE_COLORS[item.type],
                        border: `1px solid ${TYPE_COLORS[item.type]}44`,
                        borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                        textAlign: 'center', display: 'inline-block'
                      }}>
                        {TYPE_LABELS[item.type]}
                      </span>
                      <span style={{
                        background: `var(--br-${item.style || 'info'}-subtle)`,
                        color: `var(--br-${item.style || 'info'})`,
                        border: `1px solid var(--br-${item.style || 'info'})33`,
                        borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                        textAlign: 'center', display: 'inline-block'
                      }}>
                        {STYLE_LABELS[item.style || 'info']}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{item.target_type}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{item.priority}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${item.is_active ? 'active' : 'suspended'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {item.start_date || item.end_date ? (
                      <div>
                         {item.start_date && <div>From: {formatDate(item.start_date)}</div>}
                         {item.end_date && <div>To: {formatDate(item.end_date)}</div>}
                      </div>
                    ) : <span>Lifetime</span>}
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--color-primary)' }}>{item.views_count || 0}</td>
                  <td style={{ textAlign: 'center', color: 'var(--color-success)' }}>{item.clicks_count || 0}</td>
                  <td style={{ textAlign: 'center', color: 'var(--color-warning)' }}>{item.dismissals_count || 0}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-xs" onClick={() => openEdit(item)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Edit2 size={12} /> Edit</button>
                      <button
                        className="btn btn-danger btn-xs"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleting === item.id}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {deleting === item.id ? '…' : <Trash2 size={12} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '20px', overflowY: 'auto'
        }} >
          <div style={{
            background: 'var(--color-surface)', borderRadius: 16, width: '100%', maxWidth: 760,
            border: '1px solid var(--color-border)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            margin: 'auto'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editing ? <Edit2 size={18} style={{ color: 'var(--br-primary)' }} /> : <Megaphone size={18} style={{ color: 'var(--br-primary)' }} />}
                <span>{editing ? 'Edit Announcement' : 'New Announcement'}</span>
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 22 }}>×</button>
            </div>

            <form onSubmit={handleSave} style={{ padding: 24 }}>
              <div className="form-row" style={{ marginBottom: 16 }}>
                {/* Title */}
                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Announcement title" />
                </div>

                {/* Type */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Type</label>
                  <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="banner">Fixed Banner</option>
                    <option value="modal">Modal Popup</option>
                  </select>
                </div>

                {/* Style */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Design Style</label>
                  <select className="form-input" value={form.style} onChange={e => setForm(f => ({ ...f, style: e.target.value }))}>
                    <option value="info">Info (Blue)</option>
                    <option value="success">Success (Green)</option>
                    <option value="warning">Warning (Amber)</option>
                    <option value="danger">Alert (Red)</option>
                  </select>
                </div>

                {/* Priority */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Priority (higher = first)</label>
                  <input type="number" className="form-input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} min="0" />
                </div>
              </div>

              {/* Content - WYSIWYG */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Content *</label>
                <RichEditor
                  value={form.content}
                  onChange={val => setForm(f => ({ ...f, content: val }))}
                />
              </div>

              {/* Dates */}
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Start Date (optional)</label>
                  <input type="datetime-local" className="form-input" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">End Date (optional)</label>
                  <input type="datetime-local" className="form-input" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                  { key: 'is_active', label: 'Active' },
                  { key: 'allow_dismiss', label: 'Allow "Don\'t show again"' },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{
                      width: 40, height: 22, borderRadius: 20,
                      background: form[key] ? 'var(--color-primary)' : 'var(--color-border)',
                      transition: 'background 0.2s', position: 'relative', cursor: 'pointer'
                    }} onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}>
                      <div style={{
                        position: 'absolute', top: 3, left: form[key] ? 20 : 3,
                        width: 16, height: 16, borderRadius: '50%',
                        background: '#fff', transition: 'left 0.2s'
                      }} />
                    </div>
                    <span style={{ fontSize: 13 }}>{label}</span>
                  </label>
                ))}
              </div>

              {/* Targeting */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Target Audience</label>
                <select className="form-input" value={form.target_type} onChange={e => setForm(f => ({ ...f, target_type: e.target.value }))}>
                  <option value="all">All Publishers</option>
                  <option value="publishers">Specific Publishers</option>
                  <option value="countries">Specific Countries</option>
                  <option value="roles">Specific Roles</option>
                </select>
              </div>

              {form.target_type === 'publishers' && (
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Select Publishers</label>
                  <PublisherTagInput value={form.target_publishers} onChange={v => setForm(f => ({ ...f, target_publishers: v }))} />
                </div>
              )}
              {form.target_type === 'countries' && (
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Country Codes (e.g. US, EG, GB)</label>
                  <TagInput value={form.target_countries} onChange={v => setForm(f => ({ ...f, target_countries: v }))} placeholder="Type country code and press Enter" />
                </div>
              )}
              {form.target_type === 'roles' && (
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Roles</label>
                  <TagInput value={form.target_roles} onChange={v => setForm(f => ({ ...f, target_roles: v }))} placeholder="Type role name and press Enter" />
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label className="form-label" style={{ margin: 0 }}>Action Buttons</label>
                  <button type="button" className="btn btn-secondary btn-xs" onClick={addButton}>+ Add Button</button>
                </div>
                {form.buttons.length === 0 && (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: '12px', border: '1px dashed var(--color-border)', borderRadius: 8 }}>
                    No buttons — announcement will show text only
                  </div>
                )}
                {form.buttons.map((btn, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input className="form-input" placeholder="Button text" value={btn.text} onChange={e => updateButton(idx, 'text', e.target.value)} style={{ height: 38 }} />
                    <input className="form-input" placeholder="https://..." value={btn.url} onChange={e => updateButton(idx, 'url', e.target.value)} style={{ height: 38 }} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, whiteSpace: 'nowrap', cursor: 'pointer' }}>
                      <input type="checkbox" checked={btn.new_tab} onChange={e => updateButton(idx, 'new_tab', e.target.checked)} />
                      New tab
                    </label>
                    <button type="button" onClick={() => removeButton(idx)} style={{ background: 'var(--color-danger)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', padding: '6px 10px', fontSize: 13 }}>×</button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {saving ? (
                    <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</>
                  ) : editing ? (
                    <><Save size={14} /> Update</>
                  ) : (
                    <><Send size={14} /> Create</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
