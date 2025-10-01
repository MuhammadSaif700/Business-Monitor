import React, {useState, useEffect} from 'react';
import { setApiToken } from './lib/api';
import Upload from './components/Upload';
import Dashboard from './components/Dashboard';
import SimpleLogin from './components/SimpleLogin';
import TransactionsTable from './components/TransactionsTable';
import AIChat from './components/AIChat';
import CustomDashboard from './components/CustomDashboard';
import UserProfile from './components/UserProfile';
import FeedbackForm from './components/FeedbackForm';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import CookiesPolicy from './components/CookiesPolicy';
import NotificationCenter from './components/NotificationCenter';
import DatasetList from './components/DatasetList';
import { Routes, Route, Link, useLocation } from 'react-router-dom';

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

  // Auto-set demo API key for development if no token exists
  useEffect(() => {
    if (!token) {
      console.log('No token found, setting demo API key for development')
      setToken('demoapikey')
    }
  }, [])

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
        sidebarOpen={sidebarOpen}
        onShowFeedback={()=>setShowFeedback(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar token={token} onClose={()=>setSidebarOpen(false)} isOpen={sidebarOpen} />
        {sidebarOpen && <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-20 lg:hidden" onClick={()=>setSidebarOpen(false)} />}
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

function Header({token,onLogout,onToggleTheme,theme,onToggleSidebar,sidebarOpen,onShowFeedback}){
  return (
    <header className="top-bar sticky top-0 z-50 bg-white dark:bg-slate-900">
      <div className="top-bar-content max-w-7xl mx-auto">
        {/* Left section: Menu button + Brand */}
        <div className="flex items-center gap-3">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Menu button clicked, current state:', sidebarOpen);
              onToggleSidebar();
            }}
            className={`relative inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 cursor-pointer ${
              sidebarOpen 
                ? 'from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700' 
                : 'from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-700 dark:text-slate-200 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-700'
            }`}
            aria-label="Toggle navigation"
            title={sidebarOpen ? 'Close menu' : 'Open menu'}
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span className="brand-logo text-xl sm:text-2xl font-bold">
                Business Monitor
              </span>
              <span className="hidden md:inline-flex badge bg-gradient-to-r from-blue-500 to-indigo-500 text-white">AI</span>
            </div>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-medium">Adaptive insights for every upload</p>
          </div>
        </div>
        
        {/* Right section: Action buttons */}
        <div className="flex items-center gap-3">
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

function Sidebar({token, onClose, isOpen}){
  const { pathname } = useLocation()
  return (
    <aside className={`z-20 flex w-72 lg:w-64 flex-col gap-6 px-6 py-6 border-r border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl fixed lg:relative inset-y-0 left-0 overflow-y-auto transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    }`}>

      <div className="mb-2">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Menu</div>
      </div>

      <NavSection title="Overview">
        <NavItem icon="🏠" label="Dashboard" to="/dashboard" active={pathname==='/dashboard' || pathname==='/'} />
      </NavSection>
      <NavSection title="Data">
        <NavItem icon="📤" label="Upload" to="/upload" active={pathname==='/upload'} />
        <NavItem icon="🗂️" label="My Datasets" to="/datasets" active={pathname==='/datasets'} />
        <NavItem icon="📋" label="Transactions" to="/transactions" active={pathname==='/transactions'} />
      </NavSection>
      <NavSection title="Insights">
        {/* <NavItem icon="📈" label="AI Analytics" to="/insights" active={pathname==='/insights'} /> */}
        <NavItem icon="✨" label="AI Designer" to="/designer" active={pathname==='/designer'} />
      </NavSection>
      <NavSection title="Account">
        <NavItem icon="👤" label="Profile" to="/profile" active={pathname==='/profile'} />
        <NavItem icon="🔔" label="Notifications" to="/notifications" active={pathname==='/notifications'} />
      </NavSection>

      <div className="mt-auto pt-6 space-y-2 text-xs">
        <Link to="/privacy-policy" className="block px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all">Privacy Policy</Link>
        <Link to="/terms-of-service" className="block px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all">Terms of Service</Link>
        <Link to="/cookies-policy" className="block px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all">Cookies Policy</Link>
      </div>
    </aside>
  )
}

function NavSection({title, children}){
  return (
    <div className="space-y-3">
      <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function NavItem({label, active, to, icon}){
  const className = `nav-link ${active ? 'nav-link-active' : ''}`
  const content = (
    <>
      {icon && <span className="nav-link-icon" aria-hidden="true">{icon}</span>}
      <span>{label}</span>
    </>
  )
  return to ? <Link className={className} to={to}>{content}</Link> : <span className={className}>{content}</span>
}
