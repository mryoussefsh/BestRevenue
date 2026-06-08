import { useState } from 'react'

export default function CompactAmount({ value, prefix = '$', suffix = '', decimals = 2 }) {
  const [showFull, setShowFull] = useState(false)
  
  const cleanVal = typeof value === 'string' ? value.replace(/,/g, '') : value
  const num = parseFloat(cleanVal)
  if (isNaN(num)) {
    return <span>{value}</span>
  }
  
  const abs = Math.abs(num)
  const isCompactable = abs >= 1000
  
  const formatFull = () => {
    return prefix + num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix
  }
  
  const formatCompact = () => {
    let formatted = ''
    let scaleSuffix = ''
    if (abs >= 1e6) {
      formatted = (num / 1e6).toFixed(1)
      scaleSuffix = 'M'
    } else if (abs >= 1e3) {
      formatted = (num / 1e3).toFixed(1)
      scaleSuffix = 'k'
    } else {
      return formatFull()
    }
    
    if (formatted.endsWith('.0')) {
      formatted = formatted.substring(0, formatted.length - 2)
    }
    return (num < 0 ? '-' : '') + prefix + formatted + scaleSuffix + suffix
  }
  
  if (!isCompactable) {
    return <span>{formatFull()}</span>
  }
  
  const displayText = showFull ? formatFull() : formatCompact()
  const fullText = formatFull()
  
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', verticalAlign: 'middle' }}>
      <span>{displayText}</span>
      <span 
        title={`Click to show ${showFull ? 'compact' : 'full'} amount\nFull: ${fullText}`}
        onClick={(e) => {
          e.stopPropagation()
          setShowFull(!showFull)
        }}
        style={{ 
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          color: 'var(--color-text-muted, #8b949e)',
          userSelect: 'none'
        }}
      >
        <svg 
          viewBox="0 0 24 24" 
          width="13" 
          height="13" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ verticalAlign: 'middle' }}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </span>
    </span>
  )
}
