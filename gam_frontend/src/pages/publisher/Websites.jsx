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
  const [selectedAdUnitCode, setSelectedAdUnitCode] = useState(null)

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
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adUnits[w.id].map(a => (
                            <tr key={a.id}>
                              <td style={{ fontWeight: 600 }}>{a.display_name}</td>
                              <td>
                                <span className={`badge ${a.is_active ? 'badge-active' : 'badge-inactive'}`}>
                                  {a.is_active ? '🟢 Active' : '⚫ Inactive'}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="btn btn-secondary btn-xs"
                                  onClick={() => setSelectedAdUnitCode({
                                    displayName: a.display_name,
                                    networkCode: w.gam_network_code,
                                    adUnitName: a.gam_ad_unit_name,
                                    id: a.id
                                  })}
                                >
                                  🏷️ Get Code
                                </button>
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

      {selectedAdUnitCode && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2>🏷️ Ad Unit Code: {selectedAdUnitCode.displayName}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedAdUnitCode(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  1. Header Code (Place inside the <code>&lt;head&gt;</code> section of your HTML page)
                </label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    className="form-input"
                    style={{
                      height: '140px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      whiteSpace: 'pre',
                      background: '#161e2e',
                      color: '#e2e8f0',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      padding: '10px',
                      width: '100%',
                      resize: 'none'
                    }}
                    readOnly
                    value={`<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
<script>
  window.googletag = window.googletag || {cmd: []};
  googletag.cmd.push(function() {
    googletag.defineSlot('/${selectedAdUnitCode.networkCode}/${selectedAdUnitCode.adUnitName}', [[300, 250], [728, 90], [320, 50]], 'div-gpt-ad-${selectedAdUnitCode.id}').addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });
</script>`}
                    onClick={e => e.target.select()}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    style={{ position: 'absolute', top: '8px', right: '8px', opacity: 0.9 }}
                    onClick={() => {
                      const code = `<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>\n<script>\n  window.googletag = window.googletag || {cmd: []};\n  googletag.cmd.push(function() {\n    googletag.defineSlot('/${selectedAdUnitCode.networkCode}/${selectedAdUnitCode.adUnitName}', [[300, 250], [728, 90], [320, 50]], 'div-gpt-ad-${selectedAdUnitCode.id}').addService(googletag.pubads());\n    googletag.pubads().enableSingleRequest();\n    googletag.enableServices();\n  });\n</script>`;
                      navigator.clipboard.writeText(code);
                      toast.success('Header code copied!');
                    }}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  2. Body Code (Place inside the <code>&lt;body&gt;</code> section where the ad should render)
                </label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    className="form-input"
                    style={{
                      height: '90px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      whiteSpace: 'pre',
                      background: '#161e2e',
                      color: '#e2e8f0',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      padding: '10px',
                      width: '100%',
                      resize: 'none'
                    }}
                    readOnly
                    value={`<!-- Place this div where you want the ad to display -->
<div id="div-gpt-ad-${selectedAdUnitCode.id}">
  <script>
    googletag.cmd.push(function() { googletag.display('div-gpt-ad-${selectedAdUnitCode.id}'); });
  </script>
</div>`}
                    onClick={e => e.target.select()}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    style={{ position: 'absolute', top: '8px', right: '8px', opacity: 0.9 }}
                    onClick={() => {
                      const code = `<!-- Place this div where you want the ad to display -->\n<div id="div-gpt-ad-${selectedAdUnitCode.id}">\n  <script>\n    googletag.cmd.push(function() { googletag.display('div-gpt-ad-${selectedAdUnitCode.id}'); });\n  </script>\n</div>`;
                      navigator.clipboard.writeText(code);
                      toast.success('Body code copied!');
                    }}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const fullCode = `<!-- Header Code -->\n<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>\n<script>\n  window.googletag = window.googletag || {cmd: []};\n  googletag.cmd.push(function() {\n    googletag.defineSlot('/${selectedAdUnitCode.networkCode}/${selectedAdUnitCode.adUnitName}', [[300, 250], [728, 90], [320, 50]], 'div-gpt-ad-${selectedAdUnitCode.id}').addService(googletag.pubads());\n    googletag.pubads().enableSingleRequest();\n    googletag.enableServices();\n  });\n</script>\n\n<!-- Body Code -->\n<div id="div-gpt-ad-${selectedAdUnitCode.id}">\n  <script>\n    googletag.cmd.push(function() { googletag.display('div-gpt-ad-${selectedAdUnitCode.id}'); });\n  </script>\n</div>`;
                    navigator.clipboard.writeText(fullCode);
                    toast.success('Full code block copied!');
                  }}
                >
                  Copy Full Block
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedAdUnitCode(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
