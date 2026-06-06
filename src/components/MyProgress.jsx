import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { supabase }    from '../supabaseClient'
import Spinner         from './Spinner'
import ChartTooltip    from './ChartTooltip'
import { calcStreak, aggregateByDay, SHOT_GOAL, STICK_GOAL, fmt } from '../utils'

export default function MyProgress({ profile, onBack }) {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => { fetchLogs() }, [profile.id])

  const fetchLogs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('training_logs')
      .select('*')
      .eq('user_id', profile.id)
      .order('date', { ascending: false })

    if (error) setError(error.message)
    else setLogs(data || [])
    setLoading(false)
  }

  if (loading) return <Spinner label="Loading progress…" />

  const totalShots  = logs.reduce((s, l) => s + l.shots, 0)
  const totalSticks = logs.reduce((s, l) => s + l.stickhandles, 0)
  const days        = new Set(logs.map((l) => l.date)).size
  const str         = calcStreak(logs)

  const shotData  = aggregateByDay(logs, 'shots',        14)
  const stickData = aggregateByDay(logs, 'stickhandles', 14)

  const tickStyle = { fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'Barlow Condensed' }

  return (
    <div className="main">
      {onBack && (
        <button className="btn-back" onClick={onBack}>← Back to Players</button>
      )}

      <div className="page-header">
        <div className="page-title">{onBack ? profile.name : 'My Progress'}</div>
        <div className="page-sub">
          {onBack ? `Jersey #${profile.jersey_number ?? '—'} · Player` : `${profile.name} · Summer 2026`}
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* ── Stat cards ── */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-num" style={{ color: '#CE1126' }}>{fmt(totalShots)}</div>
          <div className="stat-label">Total Shots</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: '#4db8ff' }}>{fmt(totalSticks)}</div>
          <div className="stat-label">Stickhandles</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: '#FFD700' }}>{days}</div>
          <div className="stat-label">Days Logged</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{str > 0 ? `${str}🔥` : '—'}</div>
          <div className="stat-label">Day Streak</div>
        </div>
      </div>

      {/* ── Goal progress ── */}
      <div className="full-col card">
        <div className="card-title">Summer Goals</div>

        <div className="prog-wrap">
          <div className="prog-header">
            <span className="prog-label">Shots on Net</span>
            <span className="prog-pct">
              {fmt(totalShots)} / {fmt(SHOT_GOAL)} —{' '}
              {Math.min(100, Math.round((totalShots / SHOT_GOAL) * 100))}%
            </span>
          </div>
          <div className="prog-bar-bg">
            <div
              className="prog-bar"
              style={{ width: `${Math.min(100, (totalShots / SHOT_GOAL) * 100)}%` }}
            />
          </div>
        </div>

        <div className="prog-wrap" style={{ marginBottom: 0 }}>
          <div className="prog-header">
            <span className="prog-label">Stickhandles</span>
            <span className="prog-pct">
              {fmt(totalSticks)} / {fmt(STICK_GOAL)} —{' '}
              {Math.min(100, Math.round((totalSticks / STICK_GOAL) * 100))}%
            </span>
          </div>
          <div className="prog-bar-bg">
            <div
              className="prog-bar blue"
              style={{ width: `${Math.min(100, (totalSticks / STICK_GOAL) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="two-col">
        <div className="card">
          <div className="card-title">Shots — Last 14 Days</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={shotData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={tickStyle} />
              <YAxis tick={tickStyle} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="val" name="Shots" fill="#CE1126" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Stickhandles — Last 14 Days</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stickData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={tickStyle} />
              <YAxis tick={tickStyle} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="val" name="Stickhandles" fill="#1a6fff" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
