import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Onboarding from './components/Onboarding'
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
  const { loadSettings, onboarded } = useSettingsStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading...</div>
      </div>
    )
  }

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
      <AppContent />
    </HashRouter>
  )
}

export default App