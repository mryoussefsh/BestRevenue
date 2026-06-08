import { useState, useEffect } from 'react'
import { publisherApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'

export default function PublisherRevenue() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    date_from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0,10),
    date_to: new Date().toISOString().slice(0,10),
    ad_unit_id: ''
  })
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await publisherApi.getRevenue(filters)
      setRecords(res.data?.data || [])
      setPage(1)
    } catch { toast.error('Failed to load revenue') }
    finally { setLoading(false) }
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedRecords = [...records].sort((a, b) => {
    let valA = a[sortField]
    let valB = b[sortField]

    if (sortField === 'ad_unit') {
      valA = a.ad_unit?.display_name || ''
      valB = b.ad_unit?.display_name || ''
    } else if (['impressions', 'clicks', 'ctr', 'cpm', 'publisher_cpm', 'publisher_earnings'].includes(sortField)) {
      valA = parseFloat(valA || 0)
      valB = parseFloat(valB || 0)
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const paginated = sortedRecords.slice((page - 1) * 15, page * 15)

  const totalApprovedEarnings = records
    .filter(r => r.is_closed || r.approval_status === 'approved')
    .reduce((s, r) => s + parseFloat(r.publisher_earnings || 0), 0)

  const totalPendingEarnings = records
    .filter(r => !r.is_closed && r.approval_status === 'pending')
    .reduce((s, r) => s + parseFloat(r.publisher_earnings || 0), 0)

  const totalImpressions = records.reduce((s, r) => s + parseInt(r.impressions || 0), 0)

  const handleExportPDF = async () => {
    try {
      const toastId = toast.loading('Generating PDF statement...')
      const res = await publisherApi.exportPdf(filters)
      
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', `earnings_statement_${filters.date_from}_to_${filters.date_to}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
      
      toast.dismiss(toastId)
      toast.success('PDF downloaded successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to export PDF statement')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 My Revenue</h1>
          <p className="page-subtitle">{records.length} records</p>
        </div>
        <button className="btn btn-secondary" onClick={handleExportPDF} id="export-pdf-btn">
          📄 Export PDF
        </button>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
        <div className="stat-card accent">
          <div className="stat-label">Approved Earnings</div>
          <div className="stat-value money">${totalApprovedEarnings.toFixed(2)}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Pending Earnings</div>
          <div className="stat-value money">${totalPendingEarnings.toFixed(2)}</div>
        </div>
        <div className="stat-card info">
          <div className="stat-label">Total Impressions</div>
          <div className="stat-value">{totalImpressions.toLocaleString()}</div>
        </div>
      </div>

      <div className="filter-bar">
        <input type="date" className="form-input" value={filters.date_from}
          onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
        <input type="date" className="form-input" value={filters.date_to}
          onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
        <button id="apply-pub-revenue-filter-btn" className="btn btn-primary" onClick={load}>🔍 Apply</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          {loading ? (
            <div className="empty-state"><div className="spinner"></div></div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('date')} style={{cursor: 'pointer'}}>Date {sortField === 'date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => handleSort('ad_unit')} style={{cursor: 'pointer'}}>Ad Unit {sortField === 'ad_unit' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => handleSort('impressions')} style={{cursor: 'pointer'}}>Impressions {sortField === 'impressions' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => handleSort('ctr')} style={{cursor: 'pointer'}}>CTR {sortField === 'ctr' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => handleSort('publisher_cpm')} style={{cursor: 'pointer'}}>My CPM {sortField === 'publisher_cpm' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => handleSort('publisher_earnings')} style={{cursor: 'pointer'}}>My Earnings {sortField === 'publisher_earnings' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 && (
                  <tr><td colSpan={9}>
                    <div className="empty-state">
                      <div className="empty-state-icon">💰</div>
                      <div className="empty-state-text">No revenue for this period</div>
                    </div>
                  </td></tr>
                )}
                {paginated.map(r => (
                  <tr key={r.id}>
                    <td className="text-sm">{r.date?.slice?.(0,10) || r.date}</td>
                    <td className="text-sm">
                      <div style={{ fontWeight: 600 }}>{r.ad_unit?.display_name || '—'}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{r.ad_unit?.website?.domain}</div>
                    </td>
                    <td className="money">{parseInt(r.impressions).toLocaleString()}</td>
                    <td className="money">{(parseFloat(r.ctr) * 100).toFixed(2)}%</td>
                    <td className="money">${parseFloat(r.publisher_cpm || 0).toFixed(3)}</td>
                    <td className="money positive" style={{ fontWeight: 700 }}>
                      ${parseFloat(r.publisher_earnings).toFixed(4)}
                    </td>
                    <td>
                      {r.is_closed ? (
                        <span className="badge badge-closed">🔒 Closed</span>
                      ) : r.approval_status === 'pending' ? (
                        <span className="badge badge-pending">⏳ Pending</span>
                      ) : (
                        <span className="badge badge-approved">🟢 Approved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination
          currentPage={page}
          totalItems={records.length}
          pageSize={15}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
