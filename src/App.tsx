import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Onboarding from './components/Onboarding'
import ErrorBoundary from './components/ErrorBoundary'
import Dashboard from './pages/Dashboard'
import Inbox from './pages/Inbox'
import Journal from './pages/Journal'
import Wiki from './pages/Wiki'
import WikiPage from './pages/WikiPage'
import Protocol from './pages/Protocol'
import Tasks from './pages/Tasks'
import Timetable from './pages/Timetable'
import DailyNote from './pages/DailyNote'
import AIBrain from './pages/AIBrain'
import Settings from './pages/Settings'
import { useSettingsStore } from './store'

function AppContent() {
  const { loadSettings, initializeAuth, onboarded, isLoggedIn } = useSettingsStore()
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    // Initialize auth listener first
    initializeAuth()
    
    // Then load settings (which checks for logged in user)
    loadSettings().then(() => {
      setLoading(false)
      // Small delay to ensure auth state is processed
      setTimeout(() => setAuthReady(true), 100)
    })
  }, [])

  // Show loading while checking auth
  if (loading || !authReady) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-[var(--text-secondary)]">Loading...</div>
        </div>
      </div>
    )
  }

  // If user is logged in, they're onboarded (profile exists)
  if (isLoggedIn) {
    return (
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/daily" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="journal" element={<Journal />} />
          <Route path="wiki" element={<Wiki />} />
          <Route path="wiki/:slug" element={<WikiPage />} />
          <Route path="protocol" element={<Protocol />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="daily" element={<DailyNote />} />
<Route path="ai" element={<AIBrain />} />
          <Route path="brain" element={<AIBrain />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    )
  }

  // Not logged in - show onboarding only if not onboarded
  if (!onboarded) {
    return <Onboarding />
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/daily" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="journal" element={<Journal />} />
        <Route path="wiki" element={<Wiki />} />
        <Route path="wiki/:slug" element={<WikiPage />} />
        <Route path="protocol" element={<Protocol />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="daily" element={<DailyNote />} />
        <Route path="ai" element={<AIBrain />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </HashRouter>
  )
}

export default App