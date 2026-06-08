import { useState, useEffect } from 'react'
import { supabase }   from '../supabaseClient'
import Spinner        from './Spinner'
import { todayISO, fmtDateLong, fmtDate, fmt } from '../utils'

export default function LogToday({ profile }) {
  const [loading, setLoading]  = useState(true)
  const [saving,  setSaving]   = useState(false)
  const [shots,   setShots]    = useState(0)
  const [sticks,  setSticks]   = useState(0)
  const [status,  setStatus]   = useState('')
  const [logDate, setLogDate]  = useState(todayISO())

  async function fetchData() {
    setLoading(true)
    const { data, error } = await supabase
      .from('training_logs')
      .select('*')
      .eq('user_id', profile.id)
      .eq('date', logDate)
      .maybeSingle()
    if (!error && data) {
      setShots(data.shots  ?? 0)
      setSticks(data.sticks ?? 0)
      setStatus('Entry saved — update below')
    } else {
      setShots(0)
      setSticks(0)
      setStatus('')
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [logDate])

  async function handleSave() {
    setSaving(true)
    setStatus('')
    const { error } = await supabase
      .from('training_logs')
      .upsert(
        { user_id: profile.id, date: logDate, shots, sticks: sticks },
        { onConflict: 'user_id,date' }
      )
    setSaving(false)
    setStatus(error ? 'Error saving — try again' : 'Saved!')
    if (!error) fetchData()
  }

  const [recentLogs, setRecentLogs] = useState([])
  useEffect(() => {
    supabase
      .from('training_logs')
      .select('*')
      .eq('user_id', profile.id)
      .order('date', { ascending: false })
      .limit(10)
      .then(({ data }) => setRecentLogs(data ?? []))
  }, [logDate])

  if (loading) return <Spinner />

  return (
    <div className="page log-today-page">
      <div className="page-header">
        <div className="page-title">Log Training</div>
        <div className="page-subtitle">
          {fmtDateLong(logDate)}
          {status && <> &middot; <span className="status-msg">&#x2713; {status}</span></>}
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

      <div className="counters-row">
        <div className="counter-card">
          <div className="counter-label">SHOTS ON NET</div>
          <div className="counter-value shots">{fmt(shots)}</div>
          <div className="stepper">
            <button className="step-btn" onClick={() => setShots(s => Math.max(0, s - 1))}>&#8722;</button>
            <input
              className="step-input"
              type="number"
              min="0"
              value={shots}
              onChange={e => setShots(Math.max(0, Number(e.target.value)))}
            />
            <button className="step-btn" onClick={() => setShots(s => s + 1)}>+</button>
          </div>
          <div className="quick-add">
            {[25, 50, 100, 250].map(n => (
              <button key={n} className="quick-btn shots-btn" onClick={() => setShots(s => s + n)}>+{n}</button>
            ))}
          </div>
        </div>

        <div className="counter-card">
          <div className="counter-label">STICKHANDLES</div>
          <div className="counter-value sticks">{fmt(sticks)}</div>
          <div className="stepper">
            <button className="step-btn" onClick={() => setSticks(s => Math.max(0, s - 1))}>&#8722;</button>
            <input
              className="step-input"
              type="number"
              min="0"
              value={sticks}
              onChange={e => setSticks(Math.max(0, Number(e.target.value)))}
            />
            <button className="step-btn" onClick={() => setSticks(s => s + 1)}>+</button>
          </div>
          <div className="quick-add">
            {[25, 50, 100, 250].map(n => (
              <button key={n} className="quick-btn sticks-btn" onClick={() => setSticks(s => s + n)}>+{n}</button>
            ))}
          </div>
        </div>
      </div>

      <button className="save-btn" onClick={handleSave} disabled={saving}>
        {saving ? 'SAVING…' : 'UPDATE LOG'}
      </button>

      {recentLogs.length > 0 && (
        <div className="recent-activity">
          <div className="section-label">RECENT ACTIVITY</div>
          <table className="activity-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>SHOTS</th>
                <th>STICKHANDLES</th>
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map(log => (
                <tr key={log.id}>
                  <td>{fmtDate(log.date)}</td>
                  <td className="shots">{fmt(log.shots)}</td>
                  <td className="sticks">{fmt(log.sticks)}</td>
                  <td>{fmt(log.shots + log.sticks)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
