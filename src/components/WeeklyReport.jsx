import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { supabase }   from '../supabaseClient'
import Spinner        from './Spinner'
import ChartTooltip   from './ChartTooltip'
import { offsetDate, fmtDate, todayISO, fmt } from '../utils'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const dayLabel  = (iso) => WEEKDAYS[new Date(iso + 'T12:00:00').getDay()]

export default function WeeklyReport() {
  const [data,    setData]    = useState([])       // [{profile, weekLogs}]
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const weekStart = offsetDate(6)
  const weekEnd   = todayISO()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)

    const [{ data: profiles, error: pe }, { data: allLogs, error: le }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'player'),
      supabase
        .from('training_logs')
        .select('*')
        .gte('date', weekStart)
        .lte('date', weekEnd),
    ])

    if (pe || le) { setError((pe || le).message); setLoading(false); return }

    const ranked = (profiles || [])
      .map((p) => {
        const pl  = (allLogs || []).filter((l) => l.user_id === p.id)
        const shots = pl.reduce((s, l) => s + l.shots, 0)
        const sticks = pl.reduce((s, l) => s + l.stickhandles, 0)
        return { profile: p, shots, sticks, days: new Set(pl.map((l) => l.date)).size, combined: shots + sticks }
      })
      .sort((a, b) => b.combined - a.combined)

    setData(ranked)
    setLogs(allLogs || [])
    setLoading(false)
  }

  if (loading) return <Spinner label="Building weekly report…" />

  const totalShots  = logs.reduce((s, l) => s + l.shots, 0)
  const totalSticks = logs.reduce((s, l) => s + l.stickhandles, 0)
  const activePlayers = new Set(logs.map((l) => l.user_id)).size

  // Build daily stacked data
  const days = Array.from({ length: 7 }, (_, i) => offsetDate(6 - i))
  const shotMap = {}; const stickMap = {}
  logs.forEach((l) => {
    shotMap[l.date]  = (shotMap[l.date]  || 0) + l.shots
    stickMap[l.date] = (stickMap[l.date] || 0) + l.stickhandles
  })
  const chartData = days.map((d) => ({
    date: dayLabel(d),
    shots:  shotMap[d]  || 0,
    sticks: stickMap[d] || 0,
  }))

  const medals    = ['🥇', '🥈', '🥉']
  const tickStyle = { fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Barlow Condensed' }

  return (
    <div className="main">
      <div className="page-header">
        <div className="page-title">Weekly Report</div>
        <div className="page-sub">Admin only · send each Monday</div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Report card */}
      <div style={{
        background: 'var(--royal)',
        border: '2px solid var(--red)',
        borderRadius: 14,
        padding: 28,
        marginBottom: 20,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 22, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 20 }}>
          <img src="/logo.png" style={{ width: 68, height: 68, objectFit: 'contain' }} alt="" />
          <div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 26, letterSpacing: 3, lineHeight: 1 }}>
              NORTHBROOK BLUEHAWKS
            </div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: 'var(--red)', letterSpacing: 2, lineHeight: 1.3 }}>
              WEEKLY TRAINING REPORT
            </div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 13, color: 'var(--muted)', letterSpacing: 1, marginTop: 3 }}>
              Week of {fmtDate(weekStart)} – {fmtDate(weekEnd)}
            </div>
          </div>
        </div>

        {/* Team summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            [fmt(totalShots),  'Team Shots',          '#CE1126'],
            [fmt(totalSticks), 'Team Stickhandles',   '#4db8ff'],
            [activePlayers,    'Active Players',      '#FFD700'],
            [fmt(totalShots + totalSticks), 'Total Reps', '#fff'],
          ].map(([val, lbl, color]) => (
            <div key={lbl} style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 10,
              padding: '14px 12px',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 30, color, lineHeight: 1 }}>{val}</div>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 3 }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Daily chart */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
            Daily Activity This Week
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={tickStyle} />
              <YAxis tick={tickStyle} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontFamily: 'Barlow Condensed', fontSize: 12, color: 'var(--muted)' }} />
              <Bar dataKey="shots"  name="Shots"        fill="#CE1126" stackId="a" />
              <Bar dataKey="sticks" name="Stickhandles" fill="#1a6fff" stackId="a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* This week's leaderboard */}
        <div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
            This Week's Leaders
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Player</th>
                  <th>Shots</th>
                  <th>Stickhandles</th>
                  <th>Days</th>
                  <th>Total Reps</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={r.profile.id}>
                    <td>
                      {i < 3
                        ? <span style={{ fontSize: 18 }}>{medals[i]}</span>
                        : <span style={{ fontFamily: 'Bebas Neue', fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>{i + 1}</span>
                      }
                    </td>
                    <td style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}>{r.profile.name}</td>
                    <td className="num-cell" style={{ color: '#CE1126' }}>{fmt(r.shots)}</td>
                    <td className="num-cell" style={{ color: '#4db8ff' }}>{fmt(r.sticks)}</td>
                    <td>{r.days}</td>
                    <td className="num-cell">{fmt(r.combined)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 22, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)', fontFamily: 'Barlow Condensed', fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>
          Generated {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          {' · '}Northbrook Bluehawks Hockey
          {' · '}northbrookbluehawks.com
        </div>
      </div>
    </div>
  )
}
