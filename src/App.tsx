import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
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

function App() {
  return (
    <HashRouter>
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
    </HashRouter>
  )
}

export default App