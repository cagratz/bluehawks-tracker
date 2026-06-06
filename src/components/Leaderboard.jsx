import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { supabase }   from '../supabaseClient'
import Spinner        from './Spinner'
import ChartTooltip   from './ChartTooltip'
import { buildPlayerStats, initials, fmtK, fmt, calcStreak } from '../utils'

export default function Leaderboard() {
  const [data,    setData]    = useState([])   // ranked player rows
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [sortKey, setSortKey] = useState('combined')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)

    const [{ data: profiles, error: pe }, { data: logs, error: le }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'player'),
      supabase.from('training_logs').select('*'),
    ])

    if (pe || le) { setError((pe || le).message); setLoading(false); return }

    const ranked = (profiles || []).map((p) => ({
      profile: p,
      ...buildPlayerStats(p.id, logs || []),
    }))

    setData(ranked)
    setLoading(false)
  }

  if (loading) return <Spinner label="Loading leaderboard…" />

  const sorted = [...data].sort((a, b) => b[sortKey] - a[sortKey])
  const medals = ['🥇', '🥈', '🥉']
  const podColors = ['#FFD700', '#C0C0C0', '#CD7F32']

  const top3      = sorted.slice(0, 3)
  const topShots  = [...data].sort((a, b) => b.shots  - a.shots ).slice(0, 5)
  const topSticks = [...data].sort((a, b) => b.sticks - a.sticks).slice(0, 5)

  // Podium order: 2nd | 1st | 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)
  const podiumRankOf = (item) => top3.indexOf(item)

  const tickStyle = { fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'Barlow Condensed' }
  const SortBtn = ({ k, label }) => (
    <button
      onClick={() => setSortKey(k)}
      style={{
        padding: '4px 10px',
        borderRadius: 5,
        border: '1px solid',
        borderColor: sortKey === k ? 'var(--red)' : 'var(--border)',
        background: sortKey === k ? 'rgba(206,17,38,0.15)' : 'transparent',
        color: sortKey === k ? 'var(--red)' : 'var(--muted)',
        fontFamily: 'Barlow Condensed, sans-serif',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 1,
        cursor: 'pointer',
        textTransform: 'uppercase',
        transition: 'all .2s',
      }}
    >
      {label}
    </button>
  )

  return (
    <div className="main">
      <div className="page-header">
        <div className="page-title">Team Leaderboard</div>
        <div className="page-sub">Summer 2026 · {data.length} players</div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Podium */}
      {top3.length >= 1 && (
        <div className="card full-col">
          <div className="card-title">Top 3 Overall</div>
          <div className="podium">
            {podiumOrder.map((r) => {
              const rank = podiumRankOf(r)
              return (
                <div key={r.profile.id} className={`podium-item podium-${rank + 1}`}>
                  <div className="podium-avatar" style={{ borderColor: podColors[rank] }}>
                    {initials(r.profile.name)}
                  </div>
                  <div className="podium-name">{r.profile.name.split(' ')[0]}</div>
                  <div className="podium-score">{fmtK(r.combined)} reps</div>
                  <div className="podium-block">{medals[rank]}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Full table */}
      <div className="card full-col">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>Full Rankings</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <SortBtn k="combined" label="Total" />
            <SortBtn k="shots"    label="Shots" />
            <SortBtn k="sticks"   label="Stickhandles" />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Shots</th>
                <th>Stickhandles</th>
                <th>Days</th>
                <th>Streak</th>
                <th>Total Reps</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr key={r.profile.id}>
                  <td>
                    {i < 3
                      ? <span style={{ fontSize: 20 }}>{medals[i]}</span>
                      : <span style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>{i + 1}</span>
                    }
                  </td>
                  <td>
                    <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 15 }}>{r.profile.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>#{r.profile.jersey_number ?? '—'}</div>
                  </td>
                  <td className="num-cell" style={{ color: '#CE1126' }}>{fmt(r.shots)}</td>
                  <td className="num-cell" style={{ color: '#4db8ff' }}>{fmt(r.sticks)}</td>
                  <td>{r.days}</td>
                  <td>{r.streak > 0 ? `${r.streak}🔥` : '—'}</td>
                  <td className="num-cell">{fmt(r.combined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar charts */}
      <div className="two-col">
        <div className="card">
          <div className="card-title">Top 5 · Shots on Net</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={topShots.map((r) => ({ name: r.profile.name.split(' ')[0], val: r.shots }))}
              layout="vertical"
              margin={{ left: 0, right: 10, top: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" tick={tickStyle} />
              <YAxis type="category" dataKey="name" width={70} tick={{ ...tickStyle, fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="val" name="Shots" fill="#CE1126" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Top 5 · Stickhandles</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={topSticks.map((r) => ({ name: r.profile.name.split(' ')[0], val: r.sticks }))}
              layout="vertical"
              margin={{ left: 0, right: 10, top: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" tick={tickStyle} />
              <YAxis type="category" dataKey="name" width={70} tick={{ ...tickStyle, fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="val" name="Stickhandles" fill="#1a6fff" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
