import { useState, useEffect, useRef, useCallback } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { useSettings } from '../../contexts/SettingsContext'
import { Megaphone, Check, X, Trash2, Edit2, Save, Send, Calendar, Users, Globe, Play, Plus } from 'lucide-react'
import { useI18n } from '../../contexts/I18nContext'
import Pagination from '../../components/Pagination'

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
  title_ar: '',
  content: '',
  content_ar: '',
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
  const { t } = useI18n()
  const { formatDate, formatDateTimeLocal } = useSettings()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 15

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await adminApi.getAnnouncements()
      setItems(res.data?.data || [])
    } catch {
      toast.error(t('admin.announcements.toast.load_failed', 'Failed to load announcements'))
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
      title_ar: item.title_ar || '',
      content: item.content || '',
      content_ar: item.content_ar || '',
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
        toast.success(t('admin.announcements.toast.updated', 'Announcement updated'))
      } else {
        await adminApi.createAnnouncement(payload)
        toast.success(t('admin.announcements.toast.created', 'Announcement created'))
      }
      setShowForm(false)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.announcements.toast.save_failed', 'Failed to save'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm(t('admin.announcements.confirm_delete', 'Delete this announcement?'))) return
    setDeleting(id)
    try {
      await adminApi.deleteAnnouncement(id)
      toast.success(t('admin.announcements.toast.deleted', 'Deleted'))
      loadData()
    } catch {
      toast.error(t('admin.announcements.toast.delete_failed', 'Failed to delete'))
    } finally {
      setDeleting(null)
    }
  }

  // Button management helpers
  function addButton() {
    setForm(f => ({ ...f, buttons: [...f.buttons, { text: '', text_ar: '', url: '', new_tab: true }] }))
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
                {pub ? `${pub.name} (${pub.email})` : t('admin.announcements.form.loading_publisher', 'Loading...')}
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
            placeholder={t('admin.announcements.form.search_publisher_placeholder', 'Search publisher by name or email…')}
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
          <button type="button" className="btn btn-secondary" style={{ padding: '0 12px', height: 36, fontSize: 13 }} onClick={addTag}>{t('admin.announcements.btn.add', 'Add')}</button>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="loading-screen"><div className="spinner" /><span>{t('admin.announcements.loading', 'Loading announcements…')}</span></div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Megaphone size={28} style={{ color: 'var(--br-primary)' }} />
            <span>{t('admin.announcements.title', 'Announcements')}</span>
          </h1>
          <p className="page-subtitle">{t('admin.announcements.subtitle', 'Manage banners and modal popups for publishers')}</p>
        </div>
        <button className="btn btn-primary" id="create-announcement-btn" onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> {t('admin.announcements.btn.new_announcement', 'New Announcement')}
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
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{t(`admin.announcements.stats.${s.label.toLowerCase()}`, s.label)}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Megaphone size={40} /></div>
          <div className="empty-state-text">{t('admin.announcements.empty.title', 'No announcements yet')}</div>
          <div className="empty-state-sub">{t('admin.announcements.empty.sub', 'Click "New Announcement" to create one')}</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t('admin.announcements.table.col_title', 'Title')}</th>
                <th>{t('admin.announcements.table.col_type', 'Type')}</th>
                <th>{t('admin.announcements.table.col_target', 'Target')}</th>
                <th>{t('admin.announcements.table.col_priority', 'Priority')}</th>
                <th>{t('admin.announcements.table.col_status', 'Status')}</th>
                <th>{t('admin.announcements.table.col_schedule', 'Schedule')}</th>
                <th>{t('admin.announcements.table.col_actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(item => (
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
                        {t(`admin.announcements.type.${item.type}`, TYPE_LABELS[item.type])}
                      </span>
                      <span style={{
                        background: `var(--br-${item.style || 'info'}-subtle)`,
                        color: `var(--br-${item.style || 'info'})`,
                        border: `1px solid var(--br-${item.style || 'info'})33`,
                        borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                        textAlign: 'center', display: 'inline-block'
                      }}>
                        {t(`admin.announcements.style.${item.style || 'info'}`, STYLE_LABELS[item.style || 'info'])}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{t(`admin.announcements.target.${item.target_type}`, item.target_type)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{item.priority}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${item.is_active ? 'active' : 'suspended'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                      {item.is_active ? t('admin.announcements.badge.active', 'Active') : t('admin.announcements.badge.inactive', 'Inactive')}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {item.start_date || item.end_date ? (
                      <div>
                         {item.start_date && <div>{t('admin.announcements.schedule.from', 'From: {date}', { date: formatDate(item.start_date) })}</div>}
                         {item.end_date && <div>{t('admin.announcements.schedule.to', 'To: {date}', { date: formatDate(item.end_date) })}</div>}
                      </div>
                    ) : <span>{t('admin.announcements.schedule.lifetime', 'Lifetime')}</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-xs" onClick={() => openEdit(item)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Edit2 size={12} /> {t('admin.announcements.btn.edit', 'Edit')}</button>
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
          <Pagination
            currentPage={page}
            totalItems={items.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
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
                <span>{editing ? t('admin.announcements.modal.edit_title', 'Edit Announcement') : t('admin.announcements.modal.create_title', 'New Announcement')}</span>
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 22 }}>×</button>
            </div>

            <form onSubmit={handleSave} style={{ padding: 24 }}>
              <div className="form-row" style={{ marginBottom: 16 }}>
                {/* Title (English) */}
                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                  <label className="form-label">{t('admin.announcements.form.title_label', 'Title (English) *')}</label>
                  <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder={t('admin.announcements.form.title_placeholder', 'Announcement title')} />
                </div>

                {/* Title (Arabic) */}
                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                  <label className="form-label">{t('admin.announcements.form.title_ar_label', 'Title (Arabic)')}</label>
                  <input className="form-input" value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} placeholder={t('admin.announcements.form.title_ar_placeholder', 'Arabic announcement title')} dir="rtl" />
                </div>

                {/* Type */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('admin.announcements.form.type_label', 'Type')}</label>
                  <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="banner">{t('admin.announcements.type.banner', 'Fixed Banner')}</option>
                    <option value="modal">{t('admin.announcements.type.modal', 'Modal Popup')}</option>
                  </select>
                </div>

                {/* Style */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('admin.announcements.form.style_label', 'Design Style')}</label>
                  <select className="form-input" value={form.style} onChange={e => setForm(f => ({ ...f, style: e.target.value }))}>
                    <option value="info">{t('admin.announcements.style.info', 'Info (Blue)')}</option>
                    <option value="success">{t('admin.announcements.style.success', 'Success (Green)')}</option>
                    <option value="warning">{t('admin.announcements.style.warning', 'Warning (Amber)')}</option>
                    <option value="danger">{t('admin.announcements.style.danger', 'Alert (Red)')}</option>
                  </select>
                </div>

                {/* Priority */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('admin.announcements.form.priority_label', 'Priority (higher = first)')}</label>
                  <input type="number" className="form-input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} min="0" />
                </div>
              </div>

              {/* Content (English) - WYSIWYG */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">{t('admin.announcements.form.content_label', 'Content (English) *')}</label>
                <RichEditor
                  value={form.content}
                  onChange={val => setForm(f => ({ ...f, content: val }))}
                />
              </div>

              {/* Content (Arabic) - WYSIWYG */}
              <div className="form-group" style={{ marginBottom: 16 }} dir="rtl">
                <label className="form-label" style={{ textAlign: 'right', display: 'block' }}>{t('admin.announcements.form.content_ar_label', 'Content (Arabic)')}</label>
                <RichEditor
                  value={form.content_ar}
                  onChange={val => setForm(f => ({ ...f, content_ar: val }))}
                />
              </div>

              {/* Dates */}
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('admin.announcements.form.start_date_label', 'Start Date (optional)')}</label>
                  <input type="datetime-local" className="form-input" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('admin.announcements.form.end_date_label', 'End Date (optional)')}</label>
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
                    <span style={{ fontSize: 13 }}>{t(`admin.announcements.form.${key}_toggle`, label)}</span>
                  </label>
                ))}
              </div>

              {/* Targeting */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">{t('admin.announcements.form.target_audience', 'Target Audience')}</label>
                <select className="form-input" value={form.target_type} onChange={e => setForm(f => ({ ...f, target_type: e.target.value }))}>
                  <option value="all">{t('admin.announcements.target.all', 'All Publishers')}</option>
                  <option value="publishers">{t('admin.announcements.target.publishers', 'Specific Publishers')}</option>
                  <option value="countries">{t('admin.announcements.target.countries', 'Specific Countries')}</option>
                  <option value="roles">{t('admin.announcements.target.roles', 'Specific Roles')}</option>
                </select>
              </div>

              {form.target_type === 'publishers' && (
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">{t('admin.announcements.form.select_publishers', 'Select Publishers')}</label>
                  <PublisherTagInput value={form.target_publishers} onChange={v => setForm(f => ({ ...f, target_publishers: v }))} />
                </div>
              )}
              {form.target_type === 'countries' && (
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">{t('admin.announcements.form.country_codes', 'Country Codes (e.g. US, EG, GB)')}</label>
                  <TagInput value={form.target_countries} onChange={v => setForm(f => ({ ...f, target_countries: v }))} placeholder={t('admin.announcements.form.country_placeholder', 'Type country code and press Enter')} />
                </div>
              )}
              {form.target_type === 'roles' && (
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">{t('admin.announcements.form.roles', 'Roles')}</label>
                  <TagInput value={form.target_roles} onChange={v => setForm(f => ({ ...f, target_roles: v }))} placeholder={t('admin.announcements.form.role_placeholder', 'Type role name and press Enter')} />
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label className="form-label" style={{ margin: 0 }}>{t('admin.announcements.form.action_buttons', 'Action Buttons')}</label>
                  <button type="button" className="btn btn-secondary btn-xs" onClick={addButton}>{t('admin.announcements.btn.add_button', '+ Add Button')}</button>
                </div>
                {form.buttons.length === 0 && (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: '12px', border: '1px dashed var(--color-border)', borderRadius: 8 }}>
                    {t('admin.announcements.form.no_buttons', 'No buttons — announcement will show text only')}
                  </div>
                )}
                {form.buttons.map((btn, idx) => (
                  <div key={idx} className="announcement-button-row">
                    <input className="form-input" placeholder={t('admin.announcements.form.btn_text_placeholder', 'Text (EN)')} value={btn.text} onChange={e => updateButton(idx, 'text', e.target.value)} style={{ height: 38 }} />
                    <input className="form-input" placeholder={t('admin.announcements.form.btn_text_ar_placeholder', 'Text (AR)')} value={btn.text_ar || ''} onChange={e => updateButton(idx, 'text_ar', e.target.value)} style={{ height: 38 }} dir="rtl" />
                    <input className="form-input url-input" placeholder="URL (https://...)" value={btn.url} onChange={e => updateButton(idx, 'url', e.target.value)} style={{ height: 38 }} />
                    <label className="new-tab-label" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, whiteSpace: 'nowrap', cursor: 'pointer' }}>
                      <input type="checkbox" checked={btn.new_tab} onChange={e => updateButton(idx, 'new_tab', e.target.checked)} />
                      {t('admin.announcements.form.new_tab', 'New tab')}
                    </label>
                    <button type="button" className="remove-btn" onClick={() => removeButton(idx)} style={{ background: 'var(--color-danger)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', padding: '6px 10px', fontSize: 13 }}>×</button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>{t('admin.announcements.btn.cancel', 'Cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {saving ? (
                    <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> {t('admin.announcements.btn.saving', 'Saving…')}</>
                  ) : editing ? (
                    <><Save size={14} /> {t('admin.announcements.btn.update', 'Update')}</>
                  ) : (
                    <><Send size={14} /> {t('admin.announcements.btn.create', 'Create')}</>
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
