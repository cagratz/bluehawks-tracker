export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#0a2875',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 8,
      padding: '8px 14px',
      fontFamily: 'Barlow Condensed, sans-serif',
      fontSize: 14,
    }}>
      <div style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 4, letterSpacing: 1 }}>
        {label}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#fff', fontWeight: 600 }}>
          {p.name}: {Number(p.value).toLocaleString()}
        </div>
      ))}
    </div>
  )
}
