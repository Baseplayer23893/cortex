import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore, useWikiStore, useJournalStore, useTasksStore, useTimetableStore, useNotesStore } from '../store'
import { generateDailyBriefing } from '../lib/aiService'
import Button from '../components/ui/Button'
import { format } from 'date-fns'
import { 
  Sun, Calendar, CheckSquare, FileText, BookOpen, 
  Lightbulb, Sparkles, Loader2, Clock, ArrowRight
} from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { userName, apiKey } = useSettingsStore()
  const { items: wikiPages, fetchAll: fetchWiki } = useWikiStore()
  const { items: journalEntries, fetchAll: fetchJournal } = useJournalStore()
  const { items: tasks, fetchAll: fetchTasks } = useTasksStore()
  const { items: timetableBlocks, fetchAll: fetchTimetable } = useTimetableStore()
  const { items: notes, fetchAll: fetchNotes } = useNotesStore()

  const [briefing, setBriefing] = useState<{ summary: string; forgottenNote?: { title: string; slug: string } } | null>(null)
  const [loadingBriefing, setLoadingBriefing] = useState(false)

  useEffect(() => {
    fetchWiki()
    fetchJournal()
    fetchTasks()
    fetchTimetable()
    fetchNotes()
  }, [])

  useEffect(() => {
    if (!apiKey || briefing) return
    
    setLoadingBriefing(true)
    generateDailyBriefing({
      tasks: tasks.map(t => ({ ...t, status: t.status })),
      timetableBlocks: timetableBlocks.map(b => ({ ...b })),
      wikiPages: wikiPages.map(p => ({ ...p, updatedAt: p.updatedAt })),
      journalEntries: journalEntries.map(e => ({ date: e.date, content: e.content })),
    }).then(result => {
      setBriefing(result)
      setLoadingBriefing(false)
    })
  }, [apiKey, wikiPages.length, tasks.length, timetableBlocks.length])

  const inboxCount = notes.filter(n => n.status === 'inbox').length
  const activeTasks = tasks.filter(t => t.status !== 'done')
  const highPriorityTasks = activeTasks.filter(t => t.priority === 'high')

  const today = new Date().getDay()
  const todayBlocks = timetableBlocks.filter(b => b.dayOfWeek === today)

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1">
          {greeting()}, {userName || 'there'}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* AI Morning Briefing */}
      {apiKey && (
        <div className="mb-8 p-4 bg-gradient-to-r from-[var(--accent-soft)] to-[var(--bg-surface)] border border-[var(--accent)]/30 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--accent)]">AI Morning Briefing</h2>
          </div>
          
          {loadingBriefing ? (
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Generating your daily briefing...</span>
            </div>
          ) : briefing ? (
            <div>
              <p className="text-[var(--text-primary)] mb-3">{briefing.summary}</p>
              {briefing.forgottenNote && (
                <button
                  onClick={() => navigate(`/wiki/${briefing.forgottenNote!.slug}`)}
                  className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors"
                >
                  <Lightbulb className="w-4 h-4 text-[var(--yellow)]" />
                  <span className="text-sm">Review: {briefing.forgottenNote.title}</span>
                  <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">Unable to generate briefing</p>
          )}
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => navigate('/inbox')}
          className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <Lightbulb className="w-5 h-5 text-[var(--green)]" />
            {inboxCount > 0 && (
              <span className="px-2 py-0.5 bg-[var(--accent)] text-white text-xs rounded-full">{inboxCount}</span>
            )}
          </div>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">{inboxCount}</p>
          <p className="text-sm text-[var(--text-secondary)]">Inbox</p>
        </button>

        <button
          onClick={() => navigate('/tasks')}
          className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckSquare className="w-5 h-5 text-[var(--blue)]" />
            {highPriorityTasks.length > 0 && (
              <span className="px-2 py-0.5 bg-[var(--red)] text-white text-xs rounded-full">{highPriorityTasks.length}</span>
            )}
          </div>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">{activeTasks.length}</p>
          <p className="text-sm text-[var(--text-secondary)]">Active Tasks</p>
        </button>

        <button
          onClick={() => navigate('/wiki')}
          className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">{wikiPages.length}</p>
          <p className="text-sm text-[var(--text-secondary)]">Wiki Pages</p>
        </button>

        <button
          onClick={() => navigate('/journal')}
          className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <BookOpen className="w-5 h-5 text-[var(--blue)]" />
          </div>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">{journalEntries.length}</p>
          <p className="text-sm text-[var(--text-secondary)]">Journal Entries</p>
        </button>
      </div>

      {/* Today's Schedule */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-[var(--text-secondary)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Today</h2>
        </div>
        
        {todayBlocks.length > 0 ? (
          <div className="space-y-2">
            {todayBlocks
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .slice(0, 5)
              .map((block, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-4 p-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg"
                >
                  <div className="flex items-center gap-2 text-[var(--text-tertiary)] w-24">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-mono">{block.startTime}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[var(--text-primary)] font-medium">{block.title}</p>
                    {block.location && (
                      <p className="text-sm text-[var(--text-secondary)]">{block.location}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-[var(--text-secondary)]">No classes scheduled for today</p>
        )}
      </div>

      {/* High Priority Tasks */}
      {highPriorityTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[var(--red)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">High Priority</h2>
          </div>
          
          <div className="space-y-2">
            {highPriorityTasks.slice(0, 3).map(task => (
              <div 
                key={task.id}
                className="flex items-center justify-between p-3 bg-[var(--bg-surface)] border border-[var(--red)]/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--red)]" />
                  <span className="text-[var(--text-primary)]">{task.title}</span>
                </div>
                {task.dueDate && (
                  <span className="text-sm text-[var(--text-tertiary)]">{task.dueDate}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}