import { useState, useEffect, useRef, useCallback } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { useSettings } from '../../contexts/SettingsContext'
import { FileText, Edit2, Trash2, Save, Send } from 'lucide-react'

// Lightweight built-in rich text editor
function RichEditor({ value, onChange }) {
  const editorRef = useRef(null)
  const isInternalUpdate = useRef(false)

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
    { label: 'H1',        cmd: 'formatBlock',    val: 'h2', title: 'Heading 2' },
    { label: 'H2',        cmd: 'formatBlock',    val: 'h3', title: 'Heading 3' },
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
              minWidth: 30
            }}
            dangerouslySetInnerHTML={{ __html: btn.label }}
          />
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        style={{
          minHeight: 220,
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
  slug: '',
  content: '',
  show_in_public_footer: false,
  show_in_publisher_footer: false,
  show_in_landing_menu: false,
  is_active: true
}

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

export default function AdminPages() {
  const { reload } = useSettings()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const slugManualEdit = useRef(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await adminApi.getPages()
      setItems(res.data?.data || [])
    } catch {
      toast.error('Failed to load pages')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    slugManualEdit.current = false
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(item) {
    setEditing(item.id)
    slugManualEdit.current = true
    setForm({
      title: item.title || '',
      slug: item.slug || '',
      content: item.content || '',
      show_in_public_footer: item.show_in_public_footer ?? false,
      show_in_publisher_footer: item.show_in_publisher_footer ?? false,
      show_in_landing_menu: item.show_in_landing_menu ?? false,
      is_active: item.is_active ?? true
    })
    setShowForm(true)
  }

  const handleTitleChange = (e) => {
    const val = e.target.value
    setForm(f => {
      const next = { ...f, title: val }
      if (!slugManualEdit.current) {
        next.slug = slugify(val)
      }
      return next
    })
  }

  const handleSlugChange = (e) => {
    slugManualEdit.current = true
    const val = slugify(e.target.value)
    setForm(f => ({ ...f, slug: val }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    if (!form.slug.trim()) return toast.error('Slug is required')
    if (!form.content.trim()) return toast.error('Content is required')

    setSaving(true)
    try {
      if (editing) {
        await adminApi.updatePage(editing, form)
        toast.success('Page updated')
      } else {
        await adminApi.createPage(form)
        toast.success('Page created')
      }
      setShowForm(false)
      loadData()
      // Reload settings context so footer and header navigation items refresh immediately
      reload()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save page')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) return
    setDeleting(id)
    try {
      await adminApi.deletePage(id)
      toast.success('Page deleted successfully')
      loadData()
      reload()
    } catch {
      toast.error('Failed to delete page')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return (
    <div className="loading-screen"><div className="spinner" /><span>Loading pages…</span></div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={28} style={{ color: 'var(--br-primary)' }} />
            <span>Page Management</span>
          </h1>
          <p className="page-subtitle">Add and edit dynamic pages (Privacy Policy, Terms, etc.) and specify where they appear</p>
        </div>
        <button className="btn btn-primary" id="create-page-btn" onClick={openCreate}>
          + New Page
        </button>
      </div>

      {/* Pages Table */}
      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FileText size={40} /></div>
          <div className="empty-state-text">No custom pages created yet</div>
          <div className="empty-state-sub">Click "New Page" to create one</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Display Locations</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.title}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--color-text-subtle)' }}>
                    /page/{item.slug}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {item.show_in_public_footer && (
                        <span className="badge badge-info" style={{ fontSize: 11 }}>Public Footer</span>
                      )}
                      {item.show_in_publisher_footer && (
                        <span className="badge badge-primary" style={{ fontSize: 11 }}>Publisher Footer</span>
                      )}
                      {item.show_in_landing_menu && (
                        <span className="badge badge-accent" style={{ fontSize: 11 }}>Landing Menu</span>
                      )}
                      {!item.show_in_public_footer && !item.show_in_publisher_footer && !item.show_in_landing_menu && (
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Hidden</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${item.is_active ? 'active' : 'suspended'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
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
            background: 'var(--color-surface)', borderRadius: 16, width: '100%', maxWidth: 840,
            border: '1px solid var(--color-border)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            margin: 'auto'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editing ? <Edit2 size={18} style={{ color: 'var(--br-primary)' }} /> : <FileText size={18} style={{ color: 'var(--br-primary)' }} />}
                <span>{editing ? 'Edit Page' : 'New Page'}</span>
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 22 }}>×</button>
            </div>

            <form onSubmit={handleSave} style={{ padding: 24 }}>
              <div className="form-row" style={{ marginBottom: 16 }}>
                {/* Title */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Page Title *</label>
                  <input
                    className="form-input"
                    value={form.title}
                    onChange={handleTitleChange}
                    required
                    placeholder="e.g. Privacy Policy"
                  />
                </div>

                {/* Slug */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Slug * (URL path identifier)</label>
                  <input
                    className="form-input"
                    value={form.slug}
                    onChange={handleSlugChange}
                    required
                    placeholder="e.g. privacy-policy"
                  />
                </div>
              </div>

              {/* Content - WYSIWYG */}
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Page Content *</label>
                <RichEditor
                  value={form.content}
                  onChange={val => setForm(f => ({ ...f, content: val }))}
                />
              </div>

              {/* Display Location Settings */}
              <div style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                padding: 16,
                marginBottom: 20
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>Placement & Visibility</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { key: 'show_in_public_footer', label: 'Show in Public Footer (Landing & Support Pages)' },
                    { key: 'show_in_publisher_footer', label: 'Show in Publisher Dashboard Footer' },
                    { key: 'show_in_landing_menu', label: 'Show in Landing Page Navigation Menu' },
                    { key: 'is_active', label: 'Page is Active and Published' },
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                      <div style={{
                        width: 42, height: 22, borderRadius: 20,
                        background: form[key] ? 'var(--color-primary)' : 'var(--color-border)',
                        transition: 'background 0.2s', position: 'relative', cursor: 'pointer'
                      }} onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}>
                        <div style={{
                          position: 'absolute', top: 3, left: form[key] ? 22 : 3,
                          width: 16, height: 16, borderRadius: '50%',
                          background: '#fff', transition: 'left 0.2s'
                        }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: key === 'is_active' ? 600 : 400 }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {saving ? (
                    <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</>
                  ) : editing ? (
                    <><Save size={14} /> Update Page</>
                  ) : (
                    <><Send size={14} /> Create Page</>
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
