import { useState, useEffect, useRef } from 'react'
import { adminApi } from '../api/endpoints'
import toast from 'react-hot-toast'

export function SearchableSelect({ value, onChange, options, placeholder, emptyMessage, isOptional, clearLabel, style, disabled }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset search when opening/closing
  useEffect(() => {
    if (!isOpen) setSearch('')
  }, [isOpen])

  const selectedOption = options.find(opt => opt.value === value)

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    (opt.subLabel && opt.subLabel.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="searchable-select-container" ref={containerRef} style={{ position: 'relative', ...style }}>
      <div
        className="form-select searchable-select-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.65 : 1,
          userSelect: 'none'
        }}
      >
        <span style={{ color: selectedOption ? 'inherit' : 'var(--color-text-muted)' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span style={{ fontSize: '10px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          ▼
        </span>
      </div>

      {isOpen && (
        <div
          className="searchable-select-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 1000,
            padding: '8px',
            maxHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <input
            type="text"
            className="form-input"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            style={{
              padding: '6px 10px',
              fontSize: '13px'
            }}
          />

          <div
            className="searchable-select-options"
            style={{
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {isOptional && (
              <div
                className="searchable-select-option"
                onClick={() => {
                  onChange('')
                  setIsOpen(false)
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--color-text-muted)',
                  borderBottom: '1px dashed var(--color-border-light)',
                  marginBottom: '4px'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--color-surface-3)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {clearLabel || 'None'}
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                {emptyMessage || 'No options found'}
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = opt.value === value
                return (
                  <div
                    key={opt.value}
                    className="searchable-select-option"
                    onClick={() => {
                      onChange(opt.value)
                      setIsOpen(false)
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      background: isSelected ? 'var(--color-primary)' : 'transparent',
                      color: isSelected ? 'white' : 'var(--color-text)',
                      transition: 'background 0.15s, color 0.15s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'var(--color-surface-3)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{opt.label}</span>
                    {opt.subLabel && (
                      <span style={{ fontSize: '11px', color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)' }}>
                        {opt.subLabel}
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function BulkAdUnitGeneratorModal({ websites, onClose, onSaved }) {
  const [form, setForm] = useState({
    website_id: websites.length === 1 ? websites[0].id : '',
    count: 3,
    sizes: [],
    custom_size: '',
    ratio_override: '',
    ad_type: 'banner',
    ad_subtype: '',
  })
  const [saving, setSaving] = useState(false)

  // Auto-select website if there's only one website available in the list
  useEffect(() => {
    if (websites.length === 1 && !form.website_id) {
      setForm(f => ({ ...f, website_id: websites[0].id }))
    }
  }, [websites, form.website_id])

  const PRESET_SIZES = [
    '200x200', '200x446', '240x400', '250x250', '250x360',
    '300x250', '300x600', '320x480', '336x280', '400x300',
    '480x320', 'Out-of-page', 'Fluid', '1x1'
  ]

  const selectedWebsite = websites.find(w => w.id === form.website_id)

  // Build the domain slug preview
  function buildSlug(domain) {
    return domain ? domain.toLowerCase().replace(/[\.\-]+/g, '_') : ''
  }

  // Build preview names based on current form state
  function buildPreviewNames() {
    if (!selectedWebsite || form.count < 1) return []
    const slug = buildSlug(selectedWebsite.domain)
    return Array.from({ length: Math.min(form.count, 20) }, (_, i) =>
      `${slug}_r?_${String(i + 1).padStart(2, '0')}`
    )
  }

  function toggleSize(size) {
    setForm(f => ({
      ...f,
      sizes: f.sizes.includes(size) ? f.sizes.filter(s => s !== size) : [...f.sizes, size]
    }))
  }

  function parseSizes(raw) {
    const parts = raw.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)
    const added = []
    setForm(f => {
      const existing = new Set(f.sizes)
      parts.forEach(part => {
        const normalized = part.replace(/\u00d7/g, 'x')
        const presetMatch = PRESET_SIZES.find(
          p => p.toLowerCase() === normalized.toLowerCase()
        )
        const final = presetMatch || normalized
        if (final && !existing.has(final)) {
          existing.add(final)
          added.push(final)
        }
      })
      return { ...f, sizes: [...existing], custom_size: '' }
    })
  }

  function addCustomSize() {
    if (!form.custom_size.trim()) return
    parseSizes(form.custom_size)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.sizes.length === 0) { toast.error('Select at least one size.'); return }
    setSaving(true)
    try {
      const payload = {
        website_id:     form.website_id,
        count:          parseInt(form.count),
        sizes:          form.sizes,
        ratio_override: form.ratio_override ? parseFloat(form.ratio_override) / 100 : null,
        ad_type:        form.ad_type,
        ad_subtype:     form.ad_type === 'reward' ? form.ad_subtype || 'normal' : null,
      }
      const res = await adminApi.bulkCreateAdUnits(payload)
      toast.success(res.data?.message || 'Ad units created!')
      onSaved()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to generate ad units')
    } finally { setSaving(false) }
  }

  const previewNames = buildPreviewNames()

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640, width: '95vw' }}>
        <div className="modal-header">
          <span className="modal-title">✨ Generate Ad Units in GAM</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>

          {/* Website & Count */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Website *</label>
              <SearchableSelect
                value={form.website_id}
                onChange={val => setForm(f => ({ ...f, website_id: val }))}
                options={websites.map(w => ({ value: w.id, label: w.domain }))}
                placeholder="Select website…"
                emptyMessage="No websites found"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Number of Banners *</label>
              <input className="form-input" type="number" min="1" max="20"
                value={form.count}
                onChange={e => setForm(f => ({ ...f, count: e.target.value }))}
                required />
            </div>
          </div>

          {/* Ad Type */}
          <div className="form-row" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Ad Type *</label>
              <select
                className="form-select"
                value={form.ad_type}
                onChange={e => setForm(f => ({
                  ...f,
                  ad_type: e.target.value,
                  ad_subtype: e.target.value === 'reward' ? 'normal' : ''
                }))}
                required
              >
                <option value="banner">Banner</option>
                <option value="reward">Reward</option>
                <option value="interstitial">Interstitial</option>
                <option value="anchor">Anchor</option>
              </select>
            </div>
            {form.ad_type === 'reward' ? (
              <div className="form-group">
                <label className="form-label">Reward Type *</label>
                <select
                  className="form-select"
                  value={form.ad_subtype}
                  onChange={e => setForm(f => ({ ...f, ad_subtype: e.target.value }))}
                  required
                >
                  <option value="normal">Normal</option>
                  <option value="repeated">Repeated</option>
                </select>
              </div>
            ) : <div />}
          </div>

          {/* Sizes */}
          <div className="form-group">
            <label className="form-label">Supported Sizes * <span className="text-muted text-xs">— applied to every banner</span></label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {PRESET_SIZES.map(s => {
                const selected = form.sizes.includes(s)
                return (
                  <button type="button" key={s} onClick={() => toggleSize(s)}
                    style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                      fontWeight: selected ? 600 : 400,
                      border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: selected ? 'var(--color-primary)' : 'transparent',
                      color: selected ? 'white' : 'var(--color-text-muted)',
                      transition: 'all 0.15s',
                    }}>
                    {s}
                  </button>
                )
              })}
              {form.sizes.filter(s => !PRESET_SIZES.includes(s)).map(s => (
                <button type="button" key={s} onClick={() => toggleSize(s)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                    fontWeight: 600, border: '1px solid var(--color-accent)',
                    background: 'var(--color-accent)', color: 'white',
                  }}>
                  {s} ✕
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input"
                placeholder="Paste sizes: 300x250, 728x90, Fluid…"
                value={form.custom_size}
                onChange={e => setForm(f => ({ ...f, custom_size: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSize())}
                onPaste={e => {
                  e.preventDefault()
                  const pasted = e.clipboardData.getData('text')
                  parseSizes(pasted)
                }}
                style={{ flex: 1 }} />
              <button type="button" className="btn btn-secondary" onClick={addCustomSize}>Add</button>
            </div>
          </div>

          {/* Ratio Override */}
          <div className="form-group">
            <label className="form-label">Ratio Override % <span className="text-muted text-xs">(optional — leave empty to inherit)</span></label>
            <input className="form-input" type="number" min="1" max="100" placeholder="Inherit from website / publisher"
              value={form.ratio_override}
              onChange={e => setForm(f => ({ ...f, ratio_override: e.target.value }))}
              style={{ maxWidth: 220 }} />
          </div>

          {/* Live Preview */}
          {previewNames.length > 0 && (
            <div style={{
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '12px 16px', marginBottom: 16,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                📋 Preview — names will be assigned round number automatically
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {previewNames.map((name, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>✓</span>
                    <code style={{ color: 'var(--color-primary-light)', fontFamily: 'monospace' }}>{name}</code>
                    {form.sizes.length > 0 && (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>
                        ({form.sizes.join(', ')})
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>
                ⚙️ <code>?</code> will be replaced with the next available round (e.g. <code>r1</code>, <code>r2</code>, …) based on existing ad units for this website.
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !form.website_id || form.sizes.length === 0}>
              {saving ? 'Generating…' : `✨ Generate ${form.count || ''} Ad Unit${form.count > 1 ? 's' : ''} in GAM`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
