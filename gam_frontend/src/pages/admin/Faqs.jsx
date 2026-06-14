import { useState, useEffect, useRef, useCallback } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { HelpCircle, Edit2, Trash2, Save, Send, ArrowUpDown } from 'lucide-react'
import { useI18n } from '../../contexts/I18nContext'
import Pagination from '../../components/Pagination'

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
  question: '',
  question_ar: '',
  answer: '',
  answer_ar: '',
  sort_order: 0,
  is_active: true
}

export default function AdminFaqs() {
  const { t } = useI18n()
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
      const res = await adminApi.getFaqs()
      setItems(res.data?.data || [])
    } catch {
      toast.error(t('faq.toast_load_fail', 'Failed to load FAQs'))
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm({
      ...EMPTY_FORM,
      sort_order: items.length > 0 ? Math.max(...items.map(i => i.sort_order || 0)) + 1 : 1
    })
    setShowForm(true)
  }

  function openEdit(item) {
    setEditing(item.id)
    setForm({
      question: item.question || '',
      question_ar: item.question_ar || '',
      answer: item.answer || '',
      answer_ar: item.answer_ar || '',
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active ?? true
    })
    setShowForm(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.question.trim()) return toast.error(t('faq.question_required', 'English Question is required'))
    if (!form.answer.trim()) return toast.error(t('faq.answer_required', 'English Answer is required'))

    setSaving(true)
    try {
      const payload = {
        ...form,
        sort_order: parseInt(form.sort_order) || 0
      }
      if (editing) {
        await adminApi.updateFaq(editing, payload)
        toast.success(t('faq.toast_updated', 'FAQ updated successfully'))
      } else {
        await adminApi.createFaq(payload)
        toast.success(t('faq.toast_created', 'FAQ created successfully'))
      }
      setShowForm(false)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || t('faq.toast_save_fail', 'Failed to save FAQ'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm(t('faq.confirm_delete', 'Are you sure you want to delete this FAQ?'))) return
    setDeleting(id)
    try {
      await adminApi.deleteFaq(id)
      toast.success(t('faq.toast_deleted', 'FAQ deleted successfully'))
      loadData()
    } catch {
      toast.error(t('faq.toast_delete_fail', 'Failed to delete FAQ'))
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return (
    <div className="loading-screen"><div className="spinner" /><span>{t('faq.loading', 'Loading FAQs…')}</span></div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={28} style={{ color: 'var(--br-primary)' }} />
            <span>{t('faq.title', 'FAQ Management')}</span>
          </h1>
          <p className="page-subtitle">{t('faq.subtitle', 'Configure, translate, and organize bilingual frequently asked questions for the public site')}</p>
        </div>
        <button className="btn btn-primary" id="create-faq-btn" onClick={openCreate}>
          + {t('faq.new_faq_btn', 'New FAQ')}
        </button>
      </div>

      {/* FAQs Table */}
      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><HelpCircle size={40} /></div>
          <div className="empty-state-text">{t('faq.no_faqs', 'No FAQ records created yet')}</div>
          <div className="empty-state-sub">{t('faq.no_faqs_hint', 'Click "New FAQ" to create one')}</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>{t('faq.col_order', 'Sort Order')}</th>
                <th>{t('faq.col_question', 'Question (English / Arabic)')}</th>
                <th>{t('faq.col_answer', 'Answer (English / Arabic)')}</th>
                <th style={{ width: 120 }}>{t('common.status', 'Status')}</th>
                <th style={{ width: 140 }}>{t('common.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(item => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--color-primary-light)' }}>
                    {item.sort_order}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.question}</div>
                    {item.question_ar && (
                      <div style={{ fontSize: 12, color: 'var(--color-text-subtle)', fontStyle: 'italic', marginTop: 4, direction: 'rtl', textAlign: 'right' }}>
                        {item.question_ar}
                      </div>
                    )}
                  </td>
                  <td style={{ maxWidth: 300 }}>
                    <div style={{ maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontSize: 13, color: 'var(--color-text-subtle)' }} dangerouslySetInnerHTML={{ __html: item.answer }} />
                    {item.answer_ar && (
                      <div style={{ maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontSize: 12, color: 'var(--color-text-subtle)', fontStyle: 'italic', marginTop: 4, direction: 'rtl', textAlign: 'right' }} dangerouslySetInnerHTML={{ __html: item.answer_ar }} />
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${item.is_active ? 'active' : 'suspended'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                      {item.is_active ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-xs" onClick={() => openEdit(item)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Edit2 size={12} /> {t('common.edit', 'Edit')}</button>
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
            background: 'var(--color-surface)', borderRadius: 16, width: '100%', maxWidth: 840,
            border: '1px solid var(--color-border)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            margin: 'auto'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editing ? <Edit2 size={18} style={{ color: 'var(--br-primary)' }} /> : <HelpCircle size={18} style={{ color: 'var(--br-primary)' }} />}
                <span>{editing ? t('faq.edit_faq', 'Edit FAQ') : t('faq.new_faq', 'New FAQ')}</span>
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 22 }}>×</button>
            </div>

            <form onSubmit={handleSave} style={{ padding: 24 }}>
              <div className="form-row" style={{ marginBottom: 16 }}>
                {/* Question (English) */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('faq.question_label', 'Question (English)')} *</label>
                  <input
                    className="form-input"
                    value={form.question}
                    onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                    required
                    placeholder={t('faq.question_placeholder', 'e.g. Do I need my own account?')}
                  />
                </div>

                {/* Question (Arabic) */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('faq.question_ar_label', 'Question (Arabic)')}</label>
                  <input
                    className="form-input"
                    value={form.question_ar}
                    onChange={e => setForm(f => ({ ...f, question_ar: e.target.value }))}
                    placeholder={t('faq.question_ar_placeholder', 'e.g. هل أحتاج إلى حساب خاص بي؟')}
                    dir="rtl"
                  />
                </div>

                {/* Sort Order */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('faq.sort_order_label', 'Sort Order')}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.sort_order}
                    onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                    required
                    min="0"
                  />
                </div>
              </div>

              {/* Answer (English) - WYSIWYG */}
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">{t('faq.answer_label', 'Answer (English)')} *</label>
                <RichEditor
                  value={form.answer}
                  onChange={val => setForm(f => ({ ...f, answer: val }))}
                />
              </div>

              {/* Answer (Arabic) - WYSIWYG */}
              <div className="form-group" style={{ marginBottom: 20 }} dir="rtl">
                <label className="form-label" style={{ textAlign: 'right', display: 'block' }}>{t('faq.answer_ar_label', 'Answer (Arabic)')}</label>
                <RichEditor
                  value={form.answer_ar}
                  onChange={val => setForm(f => ({ ...f, answer_ar: val }))}
                />
              </div>

              {/* Status Toggle */}
              <div style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                padding: 16,
                marginBottom: 20
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{
                    width: 42, height: 22, borderRadius: 20,
                    background: form.is_active ? 'var(--color-primary)' : 'var(--color-border)',
                    transition: 'background 0.2s', position: 'relative', cursor: 'pointer'
                  }} onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}>
                    <div style={{
                      position: 'absolute', top: 3, left: form.is_active ? 22 : 3,
                      width: 16, height: 16, borderRadius: '50%',
                      background: '#fff', transition: 'left 0.2s'
                    }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{t('faq.published_status', 'FAQ is Active and Published')}</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>{t('common.cancel', 'Cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {saving ? (
                    <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> {t('common.saving', 'Saving…')}</>
                  ) : editing ? (
                    <><Save size={14} /> {t('faq.update_faq', 'Update FAQ')}</>
                  ) : (
                    <><Send size={14} /> {t('faq.create_faq', 'Create FAQ')}</>
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
