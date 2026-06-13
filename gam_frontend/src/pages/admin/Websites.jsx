import { useState, useEffect, useRef } from 'react'
import { adminApi, gamAccountsApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import { BulkAdUnitGeneratorModal, SearchableSelect } from '../../components/BulkAdUnitGeneratorModal'
import { Globe, Plus, Edit2, Trash2, Sparkles, Link, Layers, X, Filter } from 'lucide-react'

export function WebsiteModal({ website, publishers, gamAccounts, onClose, onSaved, hidePublisherSelect }) {
  const isEdit = !!website?.id
  const [form, setForm] = useState({
    publisher_id: website?.publisher_id || '',
    domain: website?.domain || '',
    gam_account_id: website?.gam_account_id || '',
    gam_network_code: website?.gam_network_code || '',
    ratio_override: website?.ratio_override
      ? (parseFloat(website.ratio_override) * 100).toFixed(0)
      : '',
    is_active: website?.is_active !== false,
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.publisher_id) {
      toast.error('Publisher is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        publisher_id: form.publisher_id,
        domain: form.domain,
        gam_account_id: form.gam_account_id || null,
        gam_network_code: form.gam_network_code,
        is_active: form.is_active,
        ratio_override: form.ratio_override ? parseFloat(form.ratio_override) / 100 : null,
      }
      if (isEdit) await adminApi.updateWebsite(website.id, payload)
      else         await adminApi.createWebsite(payload)
      toast.success(isEdit ? 'Website updated!' : 'Website created!')
      onSaved()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit Website' : 'Add Website'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          {!hidePublisherSelect && (
            <div className="form-group">
              <label className="form-label">Publisher *</label>
              <SearchableSelect
                value={form.publisher_id}
                onChange={val => setForm(f => ({ ...f, publisher_id: val }))}
                options={publishers.map(p => ({
                  value: p.id,
                  label: p.name,
                  subLabel: p.email
                }))}
                placeholder="Select publisher..."
                emptyMessage="No publishers found"
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">GAM Account <span className="text-muted text-xs">(optional)</span></label>
            <SearchableSelect
              value={form.gam_account_id}
              onChange={val => {
                const acct = gamAccounts?.find(a => a.id === val);
                setForm(f => ({ 
                  ...f, 
                  gam_account_id: val,
                  gam_network_code: (acct && acct.network_code) ? acct.network_code : f.gam_network_code
                }));
              }}
              options={gamAccounts?.map(a => ({
                value: a.id,
                label: a.name,
                subLabel: `${a.email} (${a.network_code || 'No network code'})`
              })) || []}
              placeholder="No linked GAM account"
              emptyMessage="No GAM accounts found"
              isOptional={true}
              clearLabel="No linked GAM account"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Domain *</label>
              <input className="form-input" placeholder="example.com" value={form.domain}
                onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">GAM Network Code *</label>
              <input className="form-input" placeholder="123456789" value={form.gam_network_code}
                onChange={e => setForm(f => ({ ...f, gam_network_code: e.target.value }))} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ratio Override % <span className="text-muted text-xs">(optional)</span></label>
              <input className="form-input" type="number" min="1" max="100" placeholder="Inherit from publisher"
                value={form.ratio_override}
                onChange={e => setForm(f => ({ ...f, ratio_override: e.target.value }))} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: 24 }}>
              <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <span className="form-label" style={{ marginBottom: 0 }}>Active</span>
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Website'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AdUnitModal({ adUnit, websites, onClose, onSaved }) {
  const isEdit = !!adUnit?.id
  const [form, setForm] = useState({
    website_id: adUnit?.website_id || '',
    gam_ad_unit_name: adUnit?.gam_ad_unit_name || '',
    display_name: adUnit?.display_name || '',
    ratio_override: adUnit?.ratio_override
      ? (parseFloat(adUnit.ratio_override) * 100).toFixed(0)
      : '',
    is_active: adUnit?.is_active !== false,
    ad_type: adUnit?.ad_type || 'banner',
    ad_subtype: adUnit?.ad_subtype || '',
    repeat_count: adUnit?.repeat_count !== undefined && adUnit?.repeat_count !== null ? String(adUnit.repeat_count) : '2',
    delay_between_ads: adUnit?.delay_between_ads !== undefined && adUnit?.delay_between_ads !== null ? String(adUnit.delay_between_ads) : '20',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        website_id: form.website_id,
        gam_ad_unit_name: form.gam_ad_unit_name,
        display_name: form.display_name,
        is_active: form.is_active,
        ratio_override: form.ratio_override ? parseFloat(form.ratio_override) / 100 : null,
        ad_type: form.ad_type,
        ad_subtype: form.ad_type === 'reward' ? form.ad_subtype || 'normal' : (form.ad_type === 'anchor' ? form.ad_subtype || 'top' : null),
        repeat_count: (form.ad_type === 'reward' && form.ad_subtype === 'repeated') || form.ad_type === 'float_top' || form.ad_type === 'float_bottom' || form.ad_type === 'float_fullscreen' ? parseInt(form.repeat_count) : null,
        delay_between_ads: (form.ad_type === 'reward' || form.ad_type === 'float_top' || form.ad_type === 'float_bottom' || form.ad_type === 'float_fullscreen') ? parseInt(form.delay_between_ads) : null,
      }
      if (isEdit) await adminApi.updateAdUnit(adUnit.id, payload)
      else         await adminApi.createAdUnit(payload)
      toast.success(isEdit ? 'Ad Unit updated!' : 'Ad Unit created!')
      onSaved()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit Ad Unit' : 'Add Ad Unit'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Website *</label>
            <select className="form-select" value={form.website_id}
              onChange={e => setForm(f => ({ ...f, website_id: e.target.value }))} required>
              <option value="">Select website…</option>
              {websites.map(w => (
                <option key={w.id} value={w.id}>{w.domain}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">GAM Ad Unit Name *</label>
            <input className="form-input" placeholder="/123456789/homepage_leaderboard"
              value={form.gam_ad_unit_name}
              onChange={e => setForm(f => ({ ...f, gam_ad_unit_name: e.target.value }))} required />
            <span className="form-hint">Must exactly match the Ad Unit name in GAM (case-insensitive matching)</span>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Display Name *</label>
              <input className="form-input" placeholder="Homepage Banner" value={form.display_name}
                onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Ratio Override % <span className="text-muted text-xs">(optional)</span></label>
              <input className="form-input" type="number" min="1" max="100" placeholder="Inherit"
                value={form.ratio_override}
                onChange={e => setForm(f => ({ ...f, ratio_override: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ad Type *</label>
              <select
                className="form-select"
                value={form.ad_type}
                onChange={e => setForm(f => ({
                  ...f,
                  ad_type: e.target.value,
                  ad_subtype: e.target.value === 'reward' ? 'normal' : (e.target.value === 'anchor' ? 'top' : '')
                }))}
                required
              >
                <option value="banner">Banner</option>
                <option value="reward">Reward</option>
                <option value="interstitial">Interstitial</option>
                <option value="anchor">Anchor</option>
                <option value="float_top">Float Top</option>
                <option value="float_bottom">Float Bottom</option>
                <option value="float_fullscreen">Float Full Screen</option>
              </select>
            </div>
            {form.ad_type === 'reward' ? (
              <div className="form-group">
                <label className="form-label">Reward Subtype *</label>
                <select
                  className="form-select"
                  value={form.ad_subtype || 'normal'}
                  onChange={e => setForm(f => ({ ...f, ad_subtype: e.target.value }))}
                  required
                >
                  <option value="normal">Normal</option>
                  <option value="repeated">Repeated</option>
                </select>
              </div>
            ) : form.ad_type === 'anchor' ? (
              <div className="form-group">
                <label className="form-label">Anchor Position *</label>
                <select
                  className="form-select"
                  value={form.ad_subtype || 'top'}
                  onChange={e => setForm(f => ({ ...f, ad_subtype: e.target.value }))}
                  required
                >
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
            ) : <div className="form-group" />}
          </div>
          {(form.ad_type === 'reward' || form.ad_type === 'float_top' || form.ad_type === 'float_bottom' || form.ad_type === 'float_fullscreen') && (
            <div className="form-row">
              {((form.ad_type === 'reward' && form.ad_subtype === 'repeated') || form.ad_type === 'float_top' || form.ad_type === 'float_bottom' || form.ad_type === 'float_fullscreen') && (
                <div className="form-group">
                  <label className="form-label">
                    {form.ad_type === 'reward' ? 'Repeat Count *' : 'Close Button Delay (Seconds) *'}
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    min={form.ad_type === 'reward' ? "1" : "0"}
                    max="100"
                    value={form.repeat_count}
                    onChange={e => setForm(f => ({ ...f, repeat_count: e.target.value }))}
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">
                  {form.ad_type === 'reward' ? 'Delay Between Ads (Seconds) *' : 'Delay Before Showing Ad (Seconds) *'}
                </label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  max="3600"
                  value={form.delay_between_ads}
                  onChange={e => setForm(f => ({ ...f, delay_between_ads: e.target.value }))}
                  required
                />
              </div>
              {!((form.ad_type === 'reward' && form.ad_subtype === 'repeated') || form.ad_type === 'float_top' || form.ad_type === 'float_bottom' || form.ad_type === 'float_fullscreen') && <div className="form-group" />}
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Ad Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function WebsitesPage() {
  const [websites, setWebsites] = useState([])
  const [adUnits, setAdUnits] = useState([])
  const [publishers, setPublishers] = useState([])
  const [gamAccounts, setGamAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [adModal, setAdModal] = useState(null)
  const [gamAdModal, setGamAdModal] = useState(false)
  const [tab, setTab] = useState('websites')
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

  // ─── Filters ─────────────────────────────────────────────────────────────
  const [wSearch, setWSearch] = useState('')
  const [wPublisher, setWPublisher] = useState('')
  const [wGamLinked, setWGamLinked] = useState('')      // '' | 'linked' | 'unlinked'
  const [wStatus, setWStatus] = useState('')            // '' | 'active' | 'inactive'
  const [wRatio, setWRatio] = useState('')              // '' | 'override' | 'inherited'

  const [aSearch, setASearch] = useState('')
  const [aWebsite, setAWebsite] = useState('')
  const [aPublisher, setAPublisher] = useState('')
  const [aStatus, setAStatus] = useState('')            // '' | 'active' | 'inactive'
  const [aRatio, setARatio] = useState('')              // '' | 'override' | 'inherited'

  // Pagination states
  const [wPage, setWPage] = useState(1)
  const [aPage, setAPage] = useState(1)
  const [selectedAdUnits, setSelectedAdUnits] = useState([])
 
  // Reset selection on tab/pagination/filter changes
  useEffect(() => { setSelectedAdUnits([]) }, [tab, aPage, aSearch, aWebsite, aPublisher, aStatus, aRatio])
 
  const filteredWebsites = websites.filter(w => {
    const pub = publishers.find(p => p.id === w.publisher_id)
    if (wSearch && !w.domain.toLowerCase().includes(wSearch.toLowerCase())) return false
    if (wPublisher && w.publisher_id !== wPublisher) return false
    if (wGamLinked === 'linked'   && !w.gam_account_id) return false
    if (wGamLinked === 'unlinked' && w.gam_account_id)  return false
    if (wStatus === 'active'   && !w.is_active) return false
    if (wStatus === 'inactive' && w.is_active)  return false
    if (wRatio === 'override'  && !w.ratio_override) return false
    if (wRatio === 'inherited' && w.ratio_override)  return false
    return true
  })

  const filteredAdUnits = adUnits.filter(a => {
    const web = websites.find(w => w.id === a.website_id)
    const pub = publishers.find(p => p.id === web?.publisher_id)
    const q = aSearch.toLowerCase()
    if (aSearch && !a.display_name.toLowerCase().includes(q) && !a.gam_ad_unit_name.toLowerCase().includes(q)) return false
    if (aWebsite   && a.website_id !== aWebsite) return false
    if (aPublisher && web?.publisher_id !== aPublisher) return false
    if (aStatus === 'active'   && !a.is_active) return false
    if (aStatus === 'inactive' && a.is_active)  return false
    if (aRatio === 'override'  && !a.ratio_override) return false
    if (aRatio === 'inherited' && a.ratio_override)  return false
    return true
  })

  // Reset pagination when filters change
  useEffect(() => { setWPage(1) }, [wSearch, wPublisher, wGamLinked, wStatus, wRatio])
  useEffect(() => { setAPage(1) }, [aSearch, aWebsite, aPublisher, aStatus, aRatio])

  const paginatedWebsites = filteredWebsites.slice((wPage - 1) * 15, wPage * 15)
  const paginatedAdUnits = filteredAdUnits.slice((aPage - 1) * 15, aPage * 15)

  const hasWFilters = wSearch || wPublisher || wGamLinked || wStatus || wRatio
  const hasAFilters = aSearch || aWebsite || aPublisher || aStatus || aRatio

  function clearWFilters() { setWSearch(''); setWPublisher(''); setWGamLinked(''); setWStatus(''); setWRatio(''); setWPage(1) }
  function clearAFilters() { setASearch(''); setAWebsite(''); setAPublisher(''); setAStatus(''); setARatio(''); setAPage(1) }

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [wRes, aRes, pRes, gRes] = await Promise.all([
        adminApi.getWebsites().catch(() => ({ data: { data: [] } })),
        adminApi.getAdUnits().catch(() => ({ data: { data: [] } })),
        adminApi.getPublishers().catch(() => ({ data: { data: [] } })),
        gamAccountsApi.getAll().catch(() => ({ data: [] }))
      ])
      setWebsites(wRes.data?.data || [])
      setAdUnits(aRes.data?.data || [])
      setPublishers(pRes.data?.data || [])
      setGamAccounts(gRes.data || [])
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  const activeFiltersCount = tab === 'websites' 
    ? [wSearch, wPublisher, wGamLinked, wStatus, wRatio].filter(Boolean).length
    : [aSearch, aWebsite, aPublisher, aStatus, aRatio].filter(Boolean).length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={28} style={{ color: 'var(--br-primary)' }} />
            <span>Websites & Ad Units</span>
          </h1>
          <p className="page-subtitle">{websites.length} websites · {adUnits.length} ad units</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1 }}>
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
          <button id="add-website-btn" className="btn btn-secondary" onClick={() => setModal('create')}>
            <Plus size={16} /> Add Website
          </button>
          <button className="btn btn-secondary" onClick={() => setAdModal('create')}>
            <Plus size={16} /> Add Existing Ad Unit
          </button>
          <button className="btn btn-primary" onClick={() => setGamAdModal(true)}>
            <Sparkles size={16} /> Generate Ad Units
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: 0 }}>
        {['websites', 'adunits'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '10px 20px', fontWeight: 600, fontSize: 14,
              borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: tab === t ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
              transition: 'all 0.2s'
            }}>
            {t === 'websites' ? `Websites (${filteredWebsites.length})` : `Ad Units (${filteredAdUnits.length})`}
          </button>
        ))}
      </div>

      {/* ─── Filter Bar ──────────────────────────────────────────────────── */}
      {tab === 'websites' && showFiltersPanel && (
        <div className="card" style={{ padding: '16px 20px', marginTop: 24, marginBottom: 20, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 12 
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="text-muted text-xs" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search Domain</label>
                <input
                  className="form-input" placeholder="Search domain…"
                  value={wSearch} onChange={e => setWSearch(e.target.value)}
                  style={{ width: '100%', height: 38 }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="text-muted text-xs" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Publisher</label>
                <SearchableSelect
                  value={wPublisher}
                  onChange={setWPublisher}
                  options={publishers.map(p => ({
                    value: p.id,
                    label: p.name,
                    subLabel: p.email
                  }))}
                  placeholder="All Publishers"
                  emptyMessage="No publishers found"
                  isOptional={true}
                  clearLabel="All Publishers"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="text-muted text-xs" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>GAM Connection</label>
                <select className="form-select" value={wGamLinked} onChange={e => setWGamLinked(e.target.value)}
                  style={{ width: '100%', height: 38 }}>
                  <option value="">GAM Account: All</option>
                  <option value="linked">Linked to GAM</option>
                  <option value="unlinked">No GAM Account</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="text-muted text-xs" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                <select className="form-select" value={wStatus} onChange={e => setWStatus(e.target.value)}
                  style={{ width: '100%', height: 38 }}>
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="text-muted text-xs" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ratio Config</label>
                <select className="form-select" value={wRatio} onChange={e => setWRatio(e.target.value)}
                  style={{ width: '100%', height: 38 }}>
                  <option value="">Any Ratio</option>
                  <option value="override">Has Ratio Override</option>
                  <option value="inherited">Inherited Ratio</option>
                </select>
              </div>
            </div>

            {(hasWFilters || filteredWebsites.length !== websites.length) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                <span className="text-muted text-sm">
                  Showing {filteredWebsites.length} of {websites.length} websites
                </span>
                {hasWFilters && (
                  <button className="btn btn-secondary btn-xs" onClick={clearWFilters}
                    style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                    }}>
                    <X size={12} /> Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab !== 'websites' && (selectedAdUnits.length || showFiltersPanel) && (
        <div className="card" style={{ padding: '16px 20px', marginTop: 24, marginBottom: 20, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
          {selectedAdUnits.length > 0 ? (
            <div style={{
              display: 'flex', gap: 12, alignItems: 'center',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--color-danger)',
              padding: '8px 16px', borderRadius: 'var(--radius-md)',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>
                {selectedAdUnits.length} ad unit(s) selected
              </span>
              <button
                type="button"
                className="btn btn-xs"
                style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                title="Delete from platform only (keep in GAM)"
                onClick={async () => {
                  if (!confirm(`Are you sure you want to delete the ${selectedAdUnits.length} selected ad units from the platform only? They will NOT be archived in Google Ad Manager.`)) return
                  try {
                    await adminApi.bulkDeleteAdUnits({ ids: selectedAdUnits, archive: false })
                    toast.success('Selected ad units deleted successfully')
                    setSelectedAdUnits([])
                    loadAll()
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to bulk delete ad units')
                  }
                }}
              >
                🗑 Delete Selected (Local)
              </button>
              <button
                type="button"
                className="btn btn-danger btn-xs"
                title="Delete from platform and archive in GAM"
                onClick={async () => {
                  if (!confirm(`Are you sure you want to delete and archive the ${selectedAdUnits.length} selected ad units in Google Ad Manager?`)) return
                  try {
                    await adminApi.bulkDeleteAdUnits({ ids: selectedAdUnits, archive: true })
                    toast.success('Selected ad units deleted successfully')
                    setSelectedAdUnits([])
                    loadAll()
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to bulk delete ad units')
                  }
                }}
              >
                🗑 Archive Selected
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => setSelectedAdUnits([])}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: 12 
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="text-muted text-xs" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search Name/Code</label>
                  <input
                    className="form-input" placeholder="Search name or GAM code…"
                    value={aSearch} onChange={e => setASearch(e.target.value)}
                    style={{ width: '100%', height: 38 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="text-muted text-xs" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Website</label>
                  <SearchableSelect
                    value={aWebsite}
                    onChange={setAWebsite}
                    options={websites.map(w => ({
                      value: w.id,
                      label: w.domain,
                    }))}
                    placeholder="All Websites"
                    emptyMessage="No websites found"
                    isOptional={true}
                    clearLabel="All Websites"
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="text-muted text-xs" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Publisher</label>
                  <SearchableSelect
                    value={aPublisher}
                    onChange={setAPublisher}
                    options={publishers.map(p => ({
                      value: p.id,
                      label: p.name,
                      subLabel: p.email
                    }))}
                    placeholder="All Publishers"
                    emptyMessage="No publishers found"
                    isOptional={true}
                    clearLabel="All Publishers"
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="text-muted text-xs" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                  <select className="form-select" value={aStatus} onChange={e => setAStatus(e.target.value)}
                    style={{ width: '100%', height: 38 }}>
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="text-muted text-xs" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ratio Config</label>
                  <select className="form-select" value={aRatio} onChange={e => setARatio(e.target.value)}
                    style={{ width: '100%', height: 38 }}>
                    <option value="">Any Ratio</option>
                    <option value="override">Has Ratio Override</option>
                    <option value="inherited">Inherited Ratio</option>
                  </select>
                </div>
              </div>

              {(hasAFilters || filteredAdUnits.length !== adUnits.length) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                  <span className="text-muted text-sm">
                    Showing {filteredAdUnits.length} of {adUnits.length} ad units
                  </span>
                  {hasAFilters && (
                    <button className="btn btn-secondary btn-xs" onClick={clearAFilters}
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                      }}>
                      <X size={12} /> Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading
            ? <div className="empty-state"><div className="spinner"></div></div>
            : tab === 'websites' ? (
              <>
                <table className="table">
                  <thead><tr>
                    <th>Domain</th><th>Publisher</th><th>GAM Code</th>
                    <th>Ratio Override</th><th>Status</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {filteredWebsites.length === 0 && (
                      <tr><td colSpan={6}><div className="empty-state">
                        <div className="empty-state-icon"><Globe size={40} style={{ color: 'var(--br-text-2)' }} /></div>
                        <div className="empty-state-text">{hasWFilters ? 'No websites match your filters' : 'No websites yet'}</div>
                      </div></td></tr>
                    )}
                    {paginatedWebsites.map(w => {
                      const pub = publishers.find(p => p.id === w.publisher_id)
                      return (
                        <tr key={w.id}>
                          <td><strong>{w.domain}</strong></td>
                          <td className="text-muted text-sm">{pub?.name || '—'}</td>
                          <td>
                            <div className="flex gap-2 align-center">
                              <span className="text-sm"><code>{w.gam_network_code}</code></span>
                              {w.gam_account_id && <span className="badge badge-active" title="Linked to GAM OAuth Account" style={{ padding: '3px 6px' }}><Link size={12} /></span>}
                            </div>
                          </td>
                          <td>
                            {w.ratio_override
                              ? <span className="badge badge-approved">{(w.ratio_override*100).toFixed(0)}% override</span>
                              : <span className="text-muted text-xs">Inherited</span>}
                          </td>
                          <td>
                            <span className={`badge ${w.is_active ? 'badge-active' : 'badge-inactive'}`}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                              {w.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button className="btn btn-secondary btn-xs" onClick={() => setModal(w)}><Edit2 size={12} /> Edit</button>
                              <button className="btn btn-danger btn-xs"
                                onClick={async () => {
                                  if (!confirm(`Delete ${w.domain}?`)) return
                                  await adminApi.deleteWebsite(w.id)
                                  loadAll()
                                }}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <Pagination
                  currentPage={wPage}
                  totalItems={filteredWebsites.length}
                  pageSize={15}
                  onPageChange={setWPage}
                />
              </>
            ) : (
              <>
                <table className="table">
                  <thead><tr>
                    <th style={{ width: 40, paddingRight: 0 }}>
                      <input
                        type="checkbox"
                        checked={paginatedAdUnits.length > 0 && paginatedAdUnits.every(a => selectedAdUnits.includes(a.id))}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedAdUnits(paginatedAdUnits.map(a => a.id))
                          } else {
                            setSelectedAdUnits([])
                          }
                        }}
                      />
                    </th>
                    <th>Ad Unit</th><th>Website</th><th>GAM Name</th>
                    <th>Ratio Override</th><th>Status</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {filteredAdUnits.length === 0 && (
                      <tr><td colSpan={7}><div className="empty-state">
                        <div className="empty-state-icon"><Layers size={40} style={{ color: 'var(--br-text-2)' }} /></div>
                        <div className="empty-state-text">{hasAFilters ? 'No ad units match your filters' : 'No ad units yet'}</div>
                      </div></td></tr>
                    )}
                    {paginatedAdUnits.map(a => {
                      const web = websites.find(w => w.id === a.website_id)
                      return (
                        <tr key={a.id}>
                          <td style={{ paddingRight: 0 }}>
                            <input
                              type="checkbox"
                              checked={selectedAdUnits.includes(a.id)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedAdUnits(prev => [...prev, a.id])
                                } else {
                                  setSelectedAdUnits(prev => prev.filter(id => id !== a.id))
                                }
                              }}
                            />
                          </td>
                          <td><strong>{a.display_name}</strong></td>
                          <td className="text-muted text-sm">{web?.domain || '—'}</td>
                          <td style={{ maxWidth: 200 }}>
                            <code style={{ fontSize: 11, wordBreak: 'break-all' }}>{a.gam_ad_unit_name}</code>
                          </td>
                          <td>
                            {a.ratio_override
                              ? <span className="badge badge-approved">{(a.ratio_override*100).toFixed(0)}% override</span>
                              : <span className="text-muted text-xs">Inherited</span>}
                          </td>
                          <td>
                            <span className={`badge ${a.is_active ? 'badge-active' : 'badge-inactive'}`}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                              {a.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button className="btn btn-secondary btn-xs" onClick={() => setAdModal(a)}><Edit2 size={12} /> Edit</button>
                              <button className="btn btn-xs"
                                style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                                title="Delete from platform only (keep in GAM)"
                                onClick={async () => {
                                  if (!confirm(`Delete ad unit "${a.display_name}" from platform only? It will NOT be archived in Google Ad Manager.`)) return
                                  await adminApi.deleteAdUnit(a.id, { archive: false })
                                  loadAll()
                                }}><Trash2 size={12} /></button>
                              <button className="btn btn-danger btn-xs"
                                title="Delete from platform and archive in GAM"
                                onClick={async () => {
                                  if (!confirm(`Delete ad unit "${a.display_name}" from platform and archive it in Google Ad Manager?`)) return
                                  await adminApi.deleteAdUnit(a.id, { archive: true })
                                  loadAll()
                                }}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <Pagination
                  currentPage={aPage}
                  totalItems={filteredAdUnits.length}
                  pageSize={15}
                  onPageChange={setAPage}
                />
              </>
            )}
        </div>
      </div>

      {modal && (
        <WebsiteModal
          website={modal === 'create' ? null : modal}
          publishers={publishers}
          gamAccounts={gamAccounts}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadAll() }}
        />
      )}
      {adModal && (
        <AdUnitModal
          adUnit={adModal === 'create' ? null : adModal}
          websites={websites}
          onClose={() => setAdModal(null)}
          onSaved={() => { setAdModal(null); loadAll() }}
        />
      )}
      {gamAdModal && (
        <BulkAdUnitGeneratorModal
          websites={websites}
          onClose={() => setGamAdModal(false)}
          onSaved={() => { setGamAdModal(false); loadAll() }}
        />
      )}
    </div>
  )
}
