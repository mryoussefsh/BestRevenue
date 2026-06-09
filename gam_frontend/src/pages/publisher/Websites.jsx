import { useState, useEffect } from 'react'
import { publisherApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'

export default function PublisherWebsites() {
  const [websites, setWebsites] = useState([])
  const [adUnits, setAdUnits] = useState({})
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedAdsTxt, setSelectedAdsTxt] = useState(null)

  useEffect(() => {
    publisherApi.getWebsites()
      .then(r => setWebsites(r.data?.data || []))
      .catch(() => toast.error('Failed to load websites'))
      .finally(() => setLoading(false))
  }, [])

  const paginatedWebsites = websites.slice((page - 1) * 15, page * 15)

  async function toggleAdUnits(webId) {
    if (expanded === webId) { setExpanded(null); return }
    setExpanded(webId)
    if (!adUnits[webId]) {
      try {
        const res = await publisherApi.getAdUnits(webId)
        setAdUnits(a => ({ ...a, [webId]: res.data?.data || [] }))
      } catch { toast.error('Failed to load ad units') }
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🌐 My Websites</h1>
          <p className="page-subtitle">{websites.length} websites assigned to you</p>
        </div>
      </div>

      {websites.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🌐</div>
            <div className="empty-state-text">No websites assigned yet</div>
            <div className="empty-state-sub">Contact your account manager to get started</div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {paginatedWebsites.map(w => (
              <div key={w.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>🌐 {w.domain}</div>
                    <div className="text-muted text-sm" style={{ marginTop: 4 }}>
                      GAM: <code>{w.gam_network_code}</code>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className={`badge ${w.is_active ? 'badge-active' : 'badge-inactive'}`}>
                      {w.is_active ? '🟢 Active' : '⚫ Inactive'}
                    </span>
                    {w.ads_txt && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedAdsTxt({ domain: w.domain, content: w.ads_txt })}
                      >
                        📋 Show ads.txt
                      </button>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => toggleAdUnits(w.id)}
                    >
                      {expanded === w.id ? '▲ Hide' : '▼ Ad Units'} ({w.ad_units_count ?? '?'})
                    </button>
                  </div>
                </div>

                {expanded === w.id && (
                  <div style={{ marginTop: 20, borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
                    {!adUnits[w.id] ? (
                      <div className="flex items-center gap-2">
                        <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                        Loading ad units…
                      </div>
                    ) : adUnits[w.id].length === 0 ? (
                      <div className="text-muted text-sm">No ad units yet</div>
                    ) : (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Ad Unit Name</th>
                            <th>GAM Path</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adUnits[w.id].map(a => (
                            <tr key={a.id}>
                              <td style={{ fontWeight: 600 }}>{a.display_name}</td>
                              <td><code style={{ fontSize: 12 }}>{a.gam_ad_unit_name}</code></td>
                              <td>
                                <span className={`badge ${a.is_active ? 'badge-active' : 'badge-inactive'}`}>
                                  {a.is_active ? '🟢 Active' : '⚫ Inactive'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalItems={websites.length}
            pageSize={15}
            onPageChange={setPage}
          />
        </>
      )}

      {selectedAdsTxt && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>📋 Ads.txt for {selectedAdsTxt.domain}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedAdsTxt(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p className="text-muted text-sm" style={{ margin: 0 }}>
                Copy the entries below and append them to your site's root <code>ads.txt</code> file:
              </p>
              <textarea
                className="form-input"
                style={{
                  height: '200px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  whiteSpace: 'pre',
                  background: '#161e2e',
                  color: '#e2e8f0',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  padding: '12px',
                  resize: 'vertical'
                }}
                readOnly
                value={selectedAdsTxt.content}
                onClick={e => e.target.select()}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedAdsTxt.content)
                    toast.success('Ads.txt copied to clipboard!')
                  }}
                >
                  Copy Content
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedAdsTxt(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
