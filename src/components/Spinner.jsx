export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <div className="spinner-label">{label}</div>
    </div>
  )
}
