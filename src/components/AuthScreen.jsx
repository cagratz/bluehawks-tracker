import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AuthScreen() {
  const [mode,        setMode]        = useState('login')
  const [name,        setName]        = useState('')
  const [jersey,      setJersey]      = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [resetMsg,    setResetMsg]    = useState('')

  const switchMode = (m) => { setMode(m); setError(''); setResetMsg('') }

  const handleSubmit = async () => {
    setError('')
    setResetMsg('')
    if (!email.trim() || !password.trim()) { setError('Email and password are required.'); return }
    if (mode === 'create' && !name.trim())  { setError('Name is required.');              return }
    if (password.length < 6)                { setError('Password must be 6+ characters.'); return }

    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      // Pass name, jersey, role as user metadata — the DB trigger will read these
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name:          name.trim(),
            jersey_number: jersey ? Number(jersey) : null,
            role:          'player',   // admins are promoted manually in DB
          },
        },
      })
      if (error) setError(error.message)
      else setError('') // onAuthStateChange handles the rest
    }

    setLoading(false)
  }

  const handleForgotPassword = async () => {
    setError('')
    setResetMsg('')
    if (!email.trim()) { setError('Enter your email above, then click Forgot Password.'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    if (error) setError(error.message)
    else setResetMsg('Password reset email sent! Check your inbox.')
  }

  const onKey = (e) => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <img src="/logo.png" className="auth-logo" alt="Northbrook Bluehawks" />
        <div className="auth-title">BLUEHAWKS</div>
        <div className="auth-sub">Summer Training Tracker · 2026</div>

        <div className="tab-row">
          <button className={`tab-btn ${mode === 'login'  ? 'active' : ''}`} onClick={() => switchMode('login')}>Sign In</button>
          <button className={`tab-btn ${mode === 'create' ? 'active' : ''}`} onClick={() => switchMode('create')}>Create Account</button>
        </div>

        {error && <div className="error-msg">{error}</div>}
        {resetMsg && <div className="success-msg">{resetMsg}</div>}

        {mode === 'create' && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" placeholder="First Last"
                value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Jersey #</label>
              <input className="form-input" type="number" placeholder="00" min={0} max={99}
                value={jersey} onChange={(e) => setJersey(e.target.value)} />
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="you@email.com"
            value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={onKey} />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="pw-wrap">
            <input className="form-input" type={showPw ? 'text' : 'password'} placeholder="········"
              value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={onKey} />
            <button type="button" className="pw-toggle" onClick={() => setShowPw(p => !p)}
              aria-label={showPw ? 'Hide password' : 'Show password'}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'PLEASE WAIT…' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
        </button>

        {mode === 'login' && (
          <div className="forgot-wrap">
            <button type="button" className="forgot-btn" onClick={handleForgotPassword}>
              Forgot Password?
            </button>
          </div>
        )}

        {mode === 'login' && (
          <div className="demo-hint">
            <strong>First time?</strong> Click <em>Create Account</em> above to register.<br />
            Admins are assigned by the coaching staff.
          </div>
        )}
      </div>
    </div>
  )
}
