export default function Nav({ profile, view, setView, onLogout }) {
  const isAdmin = profile?.role === 'admin'

  const playerLinks = [
    { id: 'log',      label: 'Log Today'  },
    { id: 'progress', label: 'My Progress' },
  ]
  const adminLinks = [
    { id: 'leaderboard', label: 'Leaderboard'   },
    { id: 'report',      label: 'Weekly Report'  },
    { id: 'players',     label: 'Players'        },
  ]

  const links = isAdmin ? adminLinks : playerLinks

  return (
    <nav className="nav">
      <div className="nav-logo-wrap">
        <img src="/logo.png" className="nav-logo" alt="" />
        <div>
          <div className="nav-brand">BLUEHAWKS</div>
          <div className="nav-sub">Summer Training</div>
        </div>
      </div>

      <div className="nav-links">
        {links.map((l) => (
          <button
            key={l.id}
            className={`nav-link ${view === l.id ? 'active' : ''}`}
            onClick={() => setView(l.id)}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="nav-right">
        <span className="nav-user">{profile?.name}</span>
        <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-player'}`}>
          {profile?.role}
        </span>
        <button className="btn-logout" onClick={onLogout}>Sign Out</button>
      </div>
    </nav>
  )
}
