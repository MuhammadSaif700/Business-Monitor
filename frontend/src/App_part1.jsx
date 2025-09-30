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
import { useToast } from './components/ToastProvider'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('api_token') || '')
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const toast = useToast()

  useEffect(()=>{
    const stored = localStorage.getItem('theme')
    if(!stored){
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      setTheme(media.matches ? 'dark' : 'light')
      const update = ()=> setTheme(media.matches ? 'dark' : 'light')
      media.addEventListener('change', update)
      return ()=> media.removeEventListener('change', update)
    }
  },[])

  useEffect(()=>{
    if(token && token.includes('.')){
      console.warn('Detected JWT token in legacy mode. Clearing stored credentials and requesting re-login.')
      localStorage.removeItem('api_token')
      setToken('')
    }
  },[token])

  useEffect(()=>{ 
    setApiToken(token) 
  },[token])
  
  useEffect(()=>{
    if(theme==='dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', theme)
  },[theme])

  const toggleTheme = ()=> setTheme(t=> t==='dark' ? 'light' : 'dark')

  const logout = ()=>{
    localStorage.removeItem('api_token')
    setToken('')
    toast({ type:'success', message:'Logged out' })
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <SimpleLogin onAuth={setToken} />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        {sidebarOpen && (
          <div 
            className="mobile-menu-overlay lg:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex h-screen overflow-hidden">
          <div className={	ransform transition-transform duration-300 ease-in-out lg:translate-x-0 }>
            <Sidebar 
              token={token} 
              onClose={() => setSidebarOpen(false)} 
            />
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <Header
              token={token}
              onLogout={logout}
              onToggleTheme={toggleTheme}
              theme={theme}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              onShowFeedback={() => setShowFeedback(true)}
            />

            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/upload" element={<div className="space-y-6"><Upload /></div>} />
                  <Route path="/datasets" element={<div className="panel p-6"><h2 className="text-2xl font-bold mb-4">📂 My Datasets</h2></div>} />
                  <Route path="/transactions" element={<div className="panel p-6"><h2 className="text-2xl font-bold mb-4">📋 Transactions</h2><TransactionsTable /></div>} />
                  <Route path="/insights" element={<div className="panel p-6"><h2 className="text-2xl font-bold mb-4">📈 AI Analytics</h2><AIChat /></div>} />
                  <Route path="/designer" element={<CustomDashboard />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/notifications" element={<div className="panel p-6"><h2 className="text-2xl font-bold mb-4">🔔 Notifications</h2></div>} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/cookies-policy" element={<CookiesPolicy />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>

        {showFeedback && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full">
              <FeedbackForm onClose={() => setShowFeedback(false)} />
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  )
}
