import { useState, useEffect } from 'react'
import { supabase }   from '../supabaseClient'
import Spinner        from './Spinner'
import { todayISO, fmtDateLong, fmtDate, fmt } from '../utils'

export default function LogToday({ profile }) {
  const [loading, setLoading]  = useState(true)
  const [saving,  setSaving]   = useState(false)
  const [shots,   setShots]    = useState(0)
  const [sticks,  setSticks]   = useState(0)
  const [recent,  setRecent]   = useState([])
  const [saved,   setSaved]    = useState(false)
  const [error,   setError]    = useState('')
  const [logDate, setLogDate]  = useState(todayISO())

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('training_logs')
      .select('*')
      .eq('user_id', profile.id)
      .order('date', { ascending: false })
      .limit(14)
    if (error) { setError(error.message); setLoading(false); return }
    setRecent(data || [])
    const todayLog = (data || []).find((l) => l.date === logDate)
    if (todayLog) { setShots(todayLog.shots); setSticks(todayLog.stickhandles) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [logDate])

  const handleSave = async () => {
    setSaving(true); setError('')
    const { error } = await supabase
      .from('training_logs')
      .upsert(
        { user_id: profile.id, date: logDate, shots, stickhandles: sticks },
        { onConflict: 'user_id,date' }
      )
    if (error) { setError(error.message) }
    else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      fetchData()
    }
    setSaving(false)
  }

  const adj  = (setter, val, delta) => setter(Math.max(0, val + delta))
  const quick = (setter, val, amt)  => setter(Math.max(0, val + amt))

  if (loading) return <Spinner label="Loading today's log…" />

  const hasEntry = recent.some((l) => l.date === logDate)

  const Counter = ({ label, val, setter, color }) => (
    <div className="counter-card">
      <div className="counter-label">{label}</div>
      <div className="counter-display" style={{ color }}>{fmt(val)}</div>
      <div className="counter-btns">
        <button className="btn-ctr" onClick={() => adj(setter, val, -10)}>&#8722;</button>
        <input
          className="ctr-input"
          type="number" min={0}
          value={val}
          onChange={(e) => setter(Math.max(0, parseInt(e.target.value) || 0))}
        />
        <button className="btn-ctr" onClick={() => adj(setter, val, 10)}>+</button>
      </div>
      <div className="quick-btns">
        {[25, 50, 100, 250].map((n) => (
          <button key={n} className="btn-quick" onClick={() => quick(setter, val, n)}>+{n}</button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="main">
      <div className="page-header">
        <div className="page-title">Log Training</div>
        <div className="page-sub">
          {fmtDateLong(logDate)} &middot;{' '}
          {saved ? '✓ Saved!' : hasEntry ? '✓ Entry saved — update below' : 'No entry yet — log below'}
          {error && <span style={{ color: 'var(--red)' }}> &middot; {error}</span>}
        </div>
      </div>

      <div className="date-picker-row">
        <label htmlFor="log-date">Date:</label>
        <input
          id="log-date"
          type="date"
          value={logDate}
          max={todayISO()}
          onChange={e => setLogDate(e.target.value)}
        />
      </div>

      <div className="counter-grid">
        <Counter label="Shots on Net"  val={shots}  setter={setShots}  color="#CE1126" />
        <Counter label="Stickhandles"  val={sticks} setter={setSticks} color="#4db8ff" />
      </div>

      <button
        className="btn-primary"
        style={{ maxWidth: 300, display: 'block', margin: '0 auto 28px' }}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'SAVING…' : hasEntry ? 'UPDATE LOG' : 'SAVE LOG'}
      </button>

      <div className="card">
        <div className="card-title">Recent Activity</div>
        {recent.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontFamily: 'Barlow Condensed', fontSize: 15 }}>
            No logs yet — add today's first entry above!
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Shots</th>
                  <th>Stickhandles</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((l) => (
                  <tr key={l.id}>
                    <td>{fmtDate(l.date)}</td>
                    <td style={{ color: 'var(--red)' }}>{fmt(l.shots)}</td>
                    <td style={{ color: '#4db8ff' }}>{fmt(l.stickhandles)}</td>
                    <td>{fmt(l.shots + l.stickhandles)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
