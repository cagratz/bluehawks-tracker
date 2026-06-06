import { useState, useEffect } from 'react'
import { supabase }   from '../supabaseClient'
import Spinner        from './Spinner'
import { buildPlayerStats, initials, fmt, calcStreak } from '../utils'

export default function Players({ onSelect }) {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [search,  setSearch]  = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: profiles, error: pe }, { data: logs, error: le }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'player').order('name'),
      supabase.from('training_logs').select('*'),
    ])
    if (pe || le) { setError((pe || le).message); setLoading(false); return }

    const ranked = (profiles || [])
      .map((p) => ({ profile: p, ...buildPlayerStats(p.id, logs || []) }))
      .sort((a, b) => b.combined - a.combined)

    setData(ranked)
    setLoading(false)
  }

  if (loading) return <Spinner label="Loading players…" />

  const filtered = data.filter((r) =>
    r.profile.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="main">
      <div className="page-header">
        <div className="page-title">All Players</div>
        <div className="page-sub">{data.length} registered players</div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <input
        className="form-input"
        style={{ maxWidth: 300, marginBottom: 20 }}
        type="text"
        placeholder="Search players…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontFamily: 'Barlow Condensed', fontSize: 15 }}>
          {search ? 'No players match your search.' : 'No players registered yet.'}
        </p>
      ) : (
        <div className="player-grid">
          {filtered.map((r, i) => (
            <div
              key={r.profile.id}
              className="player-card"
              onClick={() => onSelect(r.profile)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div className="player-card-avatar">{initials(r.profile.name)}</div>
                <div>
                  <div className="player-card-name">{r.profile.name}</div>
                  <div className="player-card-meta">#{r.profile.jersey_number ?? '—'}</div>
                </div>
                {i < 3 && (
                  <div style={{ marginLeft: 'auto', fontSize: 20 }}>
                    {['🥇', '🥈', '🥉'][i]}
                  </div>
                )}
              </div>
              <div className="player-stat-row">
                <span>Shots</span>
                <strong style={{ color: '#CE1126' }}>{fmt(r.shots)}</strong>
              </div>
              <div className="player-stat-row">
                <span>Stickhandles</span>
                <strong style={{ color: '#4db8ff' }}>{fmt(r.sticks)}</strong>
              </div>
              <div className="player-stat-row">
                <span>Days Logged</span>
                <strong>{r.days}</strong>
              </div>
              <div className="player-stat-row">
                <span>Streak</span>
                <strong>{r.streak > 0 ? `${r.streak}🔥` : '—'}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
