// ── DATE HELPERS ──────────────────────────────────────────────────────────────
export const todayISO = () => new Date().toISOString().slice(0, 10)

export const offsetDate = (days) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export const fmtDate = (iso, opts = { month: 'short', day: 'numeric' }) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-US', opts)

export const fmtDateLong = (iso) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

// ── NUMBER HELPERS ────────────────────────────────────────────────────────────
export const fmt = (n) => Number(n).toLocaleString()
export const fmtK = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))

// ── STRING HELPERS ────────────────────────────────────────────────────────────
export const initials = (name = '') =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)

// ── STATS HELPERS ─────────────────────────────────────────────────────────────
/** Current consecutive-day streak from an array of logs */
export const calcStreak = (logs) => {
  if (!logs.length) return 0
  const dates = [...new Set(logs.map((l) => l.date))].sort((a, b) => b.localeCompare(a))
  let streak = 0
  let cursor = new Date()
  for (const d of dates) {
    const ld = new Date(d + 'T12:00:00')
    const diff = Math.round((cursor - ld) / (1000 * 60 * 60 * 24))
    if (diff <= 1) { streak++; cursor = ld } else break
  }
  return streak
}

/** Aggregate logs by date for the last N days → [{date, val}] */
export const aggregateByDay = (logs, field, days = 14) => {
  const dayList = Array.from({ length: days }, (_, i) => offsetDate(days - 1 - i))
  const map = {}
  logs.forEach((l) => { map[l.date] = (map[l.date] || 0) + Number(l[field]) })
  return dayList.map((d) => ({ date: d.slice(5), val: map[d] || 0 }))
}

/** Build player summary from logs array */
export const buildPlayerStats = (userId, logs) => {
  const pl = logs.filter((l) => l.user_id === userId)
  const shots = pl.reduce((s, l) => s + l.shots, 0)
  const sticks = pl.reduce((s, l) => s + l.stickhandles, 0)
  const days = new Set(pl.map((l) => l.date)).size
  return { shots, sticks, days, streak: calcStreak(pl), combined: shots + sticks, logs: pl }
}

// Summer goals
export const SHOT_GOAL = 5000
export const STICK_GOAL = 10000
