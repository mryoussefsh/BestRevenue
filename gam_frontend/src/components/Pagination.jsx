export default function Pagination({ currentPage, totalItems, pageSize = 15, onPageChange }) {
  const totalPages = Math.ceil(totalItems / pageSize)

  if (totalPages <= 1) return null

  // Generate page numbers to show
  const pages = []
  const maxVisiblePages = 5
  let startPage = Math.max(1, currentPage - 2)
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div className="pagination" style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
      <button
        type="button"
        className="btn btn-secondary btn-xs"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        style={{ minWidth: 50 }}
      >
        Prev
      </button>

      {startPage > 1 && (
        <>
          <button
            type="button"
            className="btn btn-xs btn-pagination-link"
            style={{
              padding: '4px 8px',
              minWidth: 28,
            }}
            onClick={() => onPageChange(1)}
          >
            1
          </button>
          {startPage > 2 && <span style={{ color: 'var(--br-text-3)', fontSize: 12 }}>...</span>}
        </>
      )}

      {pages.map(page => (
        <button
          key={page}
          type="button"
          className={`btn btn-xs ${page === currentPage ? 'btn-pagination-active' : 'btn-pagination-inactive'}`}
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            minWidth: 28,
            border: 'none',
          }}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span style={{ color: 'var(--br-text-3)', fontSize: 12 }}>...</span>}
          <button
            type="button"
            className="btn btn-xs btn-pagination-link"
            style={{
              padding: '4px 8px',
              minWidth: 28,
            }}
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        className="btn btn-secondary btn-xs"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        style={{ minWidth: 50 }}
      >
        Next
      </button>
    </div>
  )
}
