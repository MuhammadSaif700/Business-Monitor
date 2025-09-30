
function Header({token,onLogout,onToggleTheme,theme,onToggleSidebar,onShowFeedback}){
  return (
    <header className="top-bar sticky top-0 z-40">
      <div className="top-bar-content max-w-7xl mx-auto">
        <button 
          onClick={onToggleSidebar} 
          className="btn-icon lg:hidden" 
          aria-label="Toggle navigation"
        >
          <span className="text-lg">☰</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="brand-logo text-xl sm:text-2xl font-bold">
              Business Monitor
            </span>
            <span className="hidden sm:inline-flex badge bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs px-2 py-1">AI</span>
          </Link>
          <div className="hidden md:block">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Adaptive insights for every upload</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onShowFeedback} className="btn-icon hidden sm:inline-flex" title="Share feedback">
            <span>💬</span>
          </button>
          
          <Link to="/notifications" className="btn-icon hidden md:inline-flex relative" title="Notifications">
            <span>🔔</span>
          </Link>
          
          <button onClick={onToggleTheme} className="btn-icon" title="Toggle theme">
            <span className="text-lg">{theme==='dark' ? '🌙' : '☀️'}</span>
          </button>

          <Link to="/profile" className="profile-chip hidden sm:inline-flex" title="Profile">
            <span>👤</span>
            <span className="text-sm font-semibold">Profile</span>
          </Link>

          {token && (
            <>
              <button onClick={onLogout} className="btn-icon sm:hidden" title="Sign out">
                <span>⏻</span>
              </button>
              <button onClick={onLogout} className="btn btn-secondary hidden sm:inline-flex text-sm px-4 py-2">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
