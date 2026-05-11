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
  ChevronRight
} from 'lucide-react'

const navItems = [
  { path: '/daily', label: 'Daily Note', icon: FileText },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inbox', label: 'Inbox', icon: Inbox },
  { path: '/journal', label: 'Journal', icon: BookOpen },
  { path: '/wiki', label: 'Wiki', icon: ScrollText },
  { path: '/protocol', label: 'Protocol', icon: Target },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/timetable', label: 'Timetable', icon: Calendar },
  { path: '/ai', label: 'AI Brain', icon: Brain },
]

export default function Sidebar() {
  return (
    <aside className="w-[220px] h-full bg-[var(--bg-surface)] border-r border-[var(--border)] flex flex-col">
      <div className="p-4 border-b border-[var(--border)]">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Cortex</h1>
      </div>

      <nav className="flex-1 p-2 space-y-1">
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
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-[var(--border)]">
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
      </div>
    </aside>
  )
}