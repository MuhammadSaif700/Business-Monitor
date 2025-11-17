import React, {useState, useEffect} from 'react'
import { setApiToken } from './lib/api'
import Upload from './components/Upload'
import Dashboard from './components/Dashboard'
import SimpleLogin from './components/SimpleLogin'
import TransactionsTable from './components/TransactionsTable'
import AIChat from './components/AIChat'
import CustomDashboard from './components/CustomDashboard'
import UserProfile from './components/UserProfile'
import FeedbackForm from './components/FeedbackForm'
import PrivacyPolicy from './components/PrivacyPolicy'
import TermsOfService from './components/TermsOfService'
import CookiesPolicy from './components/CookiesPolicy'
import NotificationCenter from './components/NotificationCenter'
import DatasetList from './components/DatasetList'
import { Routes, Route, Link, useLocation } from 'react-router-dom'

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('api_token')||'')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [theme, setTheme] = useState(()=> localStorage.getItem('theme') || 'light')
  const [showFeedback, setShowFeedback] = useState(false)

  useEffect(()=>{
    if(typeof window === 'undefined') return
    const media = window.matchMedia('(min-width: 1024px)')
    const update = (event)=> setSidebarOpen(event.matches)
    update(media)
    media.addEventListener('change', update)
    return ()=> media.removeEventListener('change', update)
  },[])

  useEffect(()=>{
    if(token && token.includes('.')){
      console.warn('Detected JWT token in legacy mode. Clearing stored credentials and requesting re-login.')
      localStorage.removeItem('api_token')
      setToken('')
    }
  },[token])

  useEffect(()=>{ 
    console.log('Setting API token:', token)
    setApiToken(token) 
  },[token])
  useEffect(()=>{
    if(theme==='dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', theme)
  },[theme])

  const toggleTheme = ()=> setTheme(t=> t==='dark' ? 'light' : 'dark')

  // If no token, show auth form
  if (!token) {
    return <SimpleLogin onToken={setToken} />
  }

  return (
    <div className="h-full flex flex-col">
      <Header 
        token={token} 
        onLogout={()=>setToken('')} 
        onToggleTheme={toggleTheme} 
        theme={theme} 
        onToggleSidebar={()=>setSidebarOpen(o=>!o)} 
        onShowFeedback={()=>setShowFeedback(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <>
          <Sidebar token={token} onClose={()=>setSidebarOpen(false)} />
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-20 lg:hidden" onClick={()=>setSidebarOpen(false)} />
        </>}
        <main className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/designer" element={<div className="panel p-5"><CustomDashboard /></div>} />
            <Route path="/upload" element={<div className="space-y-6"><Upload /></div>} />
            <Route path="/datasets" element={<div className="space-y-6"><DatasetList /></div>} />
            <Route path="/transactions" element={<div className="panel p-5"><TransactionsTable /></div>} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/notifications" element={<div className="max-w-4xl mx-auto"><NotificationCenter /></div>} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/cookies-policy" element={<CookiesPolicy />} />
          </Routes>
        </main>
      </div>
      {showFeedback && <FeedbackForm onClose={()=>setShowFeedback(false)} />}
    </div>
  )
}

function Header({token,onLogout,onToggleTheme,theme,onToggleSidebar,onShowFeedback}){
  return (
    <header className="top-bar sticky top-0 z-40">
      <div className="top-bar-content max-w-7xl mx-auto">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onToggleSidebar} 
          className="btn-icon lg:hidden flex items-center justify-center" 
          aria-label="Toggle navigation"
        >
          <span className="text-lg">☰</span>
        </button>

        {/* Brand Section */}
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

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onShowFeedback} className="btn-icon" title="Share feedback">💬</button>
          <Link to="/notifications" className="btn-icon hidden sm:inline-flex" title="Notifications">�</Link>
          <button onClick={onToggleTheme} className="btn-icon" title="Toggle color scheme">{theme==='dark' ? '🌙' : '☀️'}</button>
          <Link to="/profile" className="profile-chip hidden sm:inline-flex" title="Profile">
            <span>👤</span>
            <span className="text-sm font-semibold">Profile</span>
          </Link>
          {token && (
            <>
              <button onClick={onLogout} className="btn-icon md:hidden" title="Sign out">⏻</button>
              <button onClick={onLogout} className="btn btn-secondary hidden md:inline-flex">Logout</button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function Sidebar({token, onClose}){
  const { pathname } = useLocation()
  return (
    <aside className="z-30 flex w-80 sm:w-72 lg:w-64 flex-col gap-6 px-4 sm:px-6 py-4 sm:py-6 border-r border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-b from-white/95 via-white/90 to-slate-50/95 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-800/95 backdrop-blur-xl shadow-2xl lg:shadow-lg fixed inset-y-0 left-0 lg:relative overflow-y-auto transition-all duration-300">
      
      {/* Mobile Close Button */}
      <div className="flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Menu</span>
        </div>
        <button onClick={onClose} className="btn-icon" aria-label="Close navigation">
          <span className="text-lg">✕</span>
        </button>
      </div>

      {/* Navigation Header */}
      {/* <div className="space-y-2 hidden lg:block">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Navigation</div>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Navigate through your workspace</p>
      </div> */}

      {/* Main Navigation */}
      <nav className="flex-1 space-y-6">
        <NavSection title=" Overview">
          <NavItem  label="Dashboard" to="/dashboard" active={pathname==='/dashboard' || pathname==='/'} />
        </NavSection>
        
        <NavSection title=" Data Management">
          <NavItem  label="Upload Dataset" to="/upload" active={pathname==='/upload'} />
          <NavItem  label="My Datasets" to="/datasets" active={pathname==='/datasets'} />
          <NavItem  label="Transactions" to="/transactions" active={pathname==='/transactions'} />
        </NavSection>
        
        <NavSection title=" AI Insights">
          <NavItem  label="AI Designer" to="/designer" active={pathname==='/designer'} />
        </NavSection>
        
        <NavSection title=" Account">
          <NavItem  label="Profile" to="/profile" active={pathname==='/profile'} />
          <NavItem  label="Notifications" to="/notifications" active={pathname==='/notifications'} />
        </NavSection>
      </nav>

      {/* Footer Links */}
      <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-4 space-y-3">
        <div className="grid grid-cols-1 gap-2 text-xs">
          <Link to="/privacy-policy" className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-all duration-200">
            <span></span>
            <span>Privacy Policy</span>
          </Link>
          <Link to="/terms-of-service" className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-all duration-200">
            <span></span>
            <span>Terms of Service</span>
          </Link>
          <Link to="/cookies-policy" className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-all duration-200">
            <span></span>
            <span>Cookies Policy</span>
          </Link>
        </div>
        {!token && (
          <div className="pt-2 px-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Professional Business Analytics Platform</p>
          </div>
        )}
      </div>
    </aside>
  )
}

function NavSection({title, children}){
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 px-1">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function NavItem({label, active, to, icon}){
  const className = `nav-link group ${active ? 'nav-link-active' : ''}`
  const content = (
    <>
      {icon && <span className="nav-link-icon transition-transform duration-300 group-hover:scale-110" aria-hidden="true">{icon}</span>}
      <span className="font-medium">{label}</span>
      {active && <span className="ml-auto text-xs">●</span>}
    </>
  )
  return to ? <Link className={className} to={to}>{content}</Link> : <span className={className}>{content}</span>
}
