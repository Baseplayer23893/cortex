import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Inbox,
  BookOpen,
  ScrollText,
  Target,
  CheckSquare,
  Calendar,
  FileText,
  Brain,
  Settings,
  Cloud,
  CloudOff,
  RefreshCw,
} from 'lucide-react'
import { useSettingsStore, useNotesStore } from '../../store'

const navItems = [
  { path: '/daily', label: 'Daily Note', icon: FileText },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inbox', label: 'Inbox', icon: Inbox, showBadge: true },
  { path: '/journal', label: 'Journal', icon: BookOpen },
  { path: '/wiki', label: 'Wiki', icon: ScrollText },
  { path: '/protocol', label: 'Protocol', icon: Target },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/timetable', label: 'Timetable', icon: Calendar },
  { path: '/ai', label: 'AI Brain', icon: Brain },
]

export default function Sidebar() {
  const { userName, isLoggedIn, syncStatus } = useSettingsStore()
  const { items, fetchAll } = useNotesStore()
  const [inboxCount, setInboxCount] = useState(0)

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    const count = items.filter(n => n.status === 'inbox').length
    setInboxCount(count)
  }, [items])

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'synced':
        return <Cloud className="w-4 h-4 text-[var(--green)]" />
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-[var(--accent)] animate-spin" />
      case 'offline':
        return <CloudOff className="w-4 h-4 text-[var(--amber)]" />
      case 'local-only':
      default:
        return <CloudOff className="w-4 h-4 text-[var(--text-tertiary)]" />
    }
  }

  const getSyncLabel = () => {
    switch (syncStatus) {
      case 'synced':
        return 'Synced'
      case 'syncing':
        return 'Syncing...'
      case 'offline':
        return 'Offline'
      case 'local-only':
      default:
        return 'Local only'
    }
  }

  return (
    <aside className="w-[220px] h-full bg-[var(--bg-surface)] border-r border-[var(--border)] flex flex-col">
      <div className="p-4 border-b border-[var(--border)]">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Cortex</h1>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-l-2 border-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
              }`
            }
          >
            <item.icon size={18} />
            <span className="flex-1">{item.label}</span>
            {item.showBadge && inboxCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-[var(--accent)] text-white rounded-full">
                {inboxCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-[var(--border)] space-y-2">
        {isLoggedIn && (
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-secondary)]">
            {getSyncIcon()}
            <span>{getSyncLabel()}</span>
          </div>
        )}

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
            }`
          }
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>

        {userName && (
          <div className="px-3 py-1.5 text-xs text-[var(--text-tertiary)]">
            {userName}
          </div>
        )}
      </div>
    </aside>
  )
}