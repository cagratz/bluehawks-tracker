import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import AuthScreen   from './components/AuthScreen'
import Nav          from './components/Nav'
import LogToday     from './components/LogToday'
import MyProgress   from './components/MyProgress'
import Leaderboard  from './components/Leaderboard'
import WeeklyReport from './components/WeeklyReport'
import Players      from './components/Players'
import Spinner      from './components/Spinner'

export default function App() {
  const [session,  setSession]  = useState(null)
  const [profile,  setProfile]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [view,     setView]     = useState(null)
  const [drillUser, setDrillUser] = useState(null)   // admin player-detail

  // ── Bootstrap auth ──────────────────────────────────────────
  useEffect(() => {
    // Check for an existing session on first load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Subscribe to future auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session) fetchProfile(session.user.id)
        else { setProfile(null); setLoading(false); setView(null) }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Profile fetch error:', error.message)
    } else {
      setProfile(data)
      setView(data?.role === 'admin' ? 'leaderboard' : 'log')
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setView(null)
    setDrillUser(null)
  }

  const handleViewPlayer = (player) => {
    setDrillUser(player)
    setView('playerDetail')
  }

  const handleBackFromDetail = () => {
    setDrillUser(null)
    setView('players')
  }

  // ── Render ───────────────────────────────────────────────────
  if (loading) return <Spinner label="Loading..." />
  if (!session || !profile) return <AuthScreen />

  const navProps = { profile, view, setView, onLogout: handleLogout }

  let content
  switch (view) {
    case 'log':          content = <LogToday   profile={profile} />; break
    case 'progress':     content = <MyProgress profile={profile} />; break
    case 'leaderboard':  content = <Leaderboard />; break
    case 'report':       content = <WeeklyReport />; break
    case 'players':      content = <Players onSelect={handleViewPlayer} />; break
    case 'playerDetail': content = drillUser
      ? <MyProgress profile={drillUser} onBack={handleBackFromDetail} />
      : null
      break
    default:             content = null
  }

  return (
    <div className="app">
      <Nav {...navProps} />
      {content}
    </div>
  )
}
