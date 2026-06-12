import { useState, useEffect } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import { Languages, Filter } from 'lucide-react'


export default function TranslationsPage() {
  const [locale, setLocale] = useState('en')
  const [translations, setTranslations] = useState([])
  const [loading, setLoading] = useState(true)
  const [edited, setEdited] = useState({})
  const [saving, setSaving] = useState({})
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

  useEffect(() => { load(locale) }, [locale])

  async function load(loc) {
    setLoading(true)
    try {
      const res = await adminApi.getTranslations(loc)
      // API returns paginated: { data: [{key, value, locale, ...}], total, ... }
      const rows = res.data?.data || []
      const list = rows.map(t => ({ key: t.key, value: t.value }))
      setTranslations(list)
      const vals = {}
      list.forEach(t => { vals[t.key] = t.value })
      setEdited(vals)
    } catch { toast.error('Failed to load translations') }
    finally { setLoading(false) }
  }

  async function handleSave(key) {
    setSaving(s => ({ ...s, [key]: true }))
    try {
      await adminApi.updateTranslation(locale, key, edited[key])
      toast.success('Translation saved!')
      setTranslations(ts => ts.map(t => t.key === key ? { ...t, value: edited[key] } : t))
    } catch { toast.error('Failed to save translation') }
    finally { setSaving(s => ({ ...s, [key]: false })) }
  }

  useEffect(() => { setPage(1) }, [search, locale])

  const filtered = translations.filter(t =>
    t.key.toLowerCase().includes(search.toLowerCase()) ||
    t.value.toLowerCase().includes(search.toLowerCase())
  )

  const paginated = filtered.slice((page - 1) * 15, page * 15)

  const activeFiltersCount = search !== '' ? 1 : 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Languages size={24} style={{ color: 'var(--color-primary)' }} /> Translations
          </h1>
          <p className="page-subtitle">Edit UI strings for English and Arabic</p>
        </div>
        <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Filter size={16} />
            <span>{showFiltersPanel ? 'Hide Filters' : 'Show Filters'}</span>
            {activeFiltersCount > 0 && (
              <span style={{
                background: 'var(--br-primary)',
                color: '#fff',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 'bold'
              }}>
                {activeFiltersCount}
              </span>
            )}
          </button>
          <button className={`btn ${locale === 'en' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setLocale('en')}>English</button>
          <button className={`btn ${locale === 'ar' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setLocale('ar')}>Arabic</button>
        </div>
      </div>

      {showFiltersPanel && (
        <div className="filter-bar">
          <input className="form-input" placeholder="Filter by key or value…"
            value={search} onChange={e => setSearch(e.target.value)} />
          <span className="text-muted text-sm">{filtered.length} strings</span>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          {loading ? (
            <div className="empty-state"><div className="spinner"></div></div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 280 }}>Key</th>
                  <th>Translation ({locale === 'en' ? 'English' : 'Arabic'})</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(t => (
                  <tr key={t.key}>
                    <td>
                      <code style={{ fontSize: 12, color: 'var(--color-primary-light)' }}>{t.key}</code>
                    </td>
                    <td>
                      <input
                        className="form-input"
                        value={edited[t.key] ?? ''}
                        onChange={e => setEdited(v => ({ ...v, [t.key]: e.target.value }))}
                        dir={locale === 'ar' ? 'rtl' : 'ltr'}
                        style={{ fontFamily: locale === 'ar' ? 'Cairo, sans-serif' : 'Inter, sans-serif' }}
                      />
                    </td>
                    <td>
                      <button
                        id={`save-translation-${t.key.replace(/\./g, '-')}`}
                        className="btn btn-primary btn-xs"
                        onClick={() => handleSave(t.key)}
                        disabled={saving[t.key] || edited[t.key] === t.value}
                      >
                        {saving[t.key] ? '…' : 'Save'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination
          currentPage={page}
          totalItems={filtered.length}
          pageSize={15}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
