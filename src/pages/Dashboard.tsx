import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore, useWikiStore, useJournalStore, useTasksStore, useTimetableStore, useNotesStore } from '../store'
import { generateDailyBriefing } from '../lib/aiService'
import { format } from 'date-fns'
import { 
  Sun, Calendar, CheckSquare, FileText, BookOpen, 
  Lightbulb, Sparkles, Loader2, Clock, ArrowRight, 
  AlertTriangle, Terminal
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
  const [briefingError, setBriefingError] = useState<string | null>(null)

  useEffect(() => {
    fetchWiki?.()
    fetchJournal?.()
    fetchTasks?.()
    fetchTimetable?.()
    fetchNotes?.()
  }, [])

  useEffect(() => {
    if (!apiKey || briefing || briefingError) return
    if (!tasks?.length && !wikiPages?.length && !timetableBlocks?.length) return
    
    setLoadingBriefing(true)
    generateDailyBriefing({
      tasks: (tasks || []).map(t => ({ ...t, status: t.status })),
      timetableBlocks: (timetableBlocks || []).map(b => ({ ...b })),
      wikiPages: (wikiPages || []).map(p => ({ ...p, updatedAt: p.updatedAt })),
      journalEntries: (journalEntries || []).map(e => ({ date: e.date, content: e.content })),
    })
    .then(result => {
      setBriefing(result)
      setLoadingBriefing(false)
    })
    .catch((error) => {
      console.error('Briefing error:', error)
      setBriefingError(error.message || 'Cortex Brain unreachable')
      setLoadingBriefing(false)
    })
  }, [apiKey, wikiPages.length, tasks.length, timetableBlocks.length])

  const inboxCount = (notes || []).filter(n => n.status === 'inbox').length
  const activeTasks = (tasks || []).filter(t => t.status !== 'done')
  const highPriorityTasks = activeTasks.filter(t => t.priority === 'high')

  const today = new Date().getDay()
  const todayBlocks = (timetableBlocks || []).filter(b => b.dayOfWeek === today)

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1">
          {greeting()}, {userName || 'there'}
        </h1>
        <p className="text-[var(--text-secondary)] font-mono text-sm">
          {format(new Date(), 'EEEE, MMMM d, yyyy • HH:mm')}
        </p>
      </div>

      {/* TOP: Full-width AI Briefing Terminal */}
      <div className="w-full">
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface)] border-b border-[var(--border)]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--red)]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--yellow)]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--green)]" />
            </div>
            <span className="ml-2 text-xs text-[var(--text-tertiary)] font-mono">cortex-brain — terminal</span>
            <Sun className="w-4 h-4 ml-auto text-[var(--accent)]" />
          </div>
          
          <div className="p-4 min-h-[120px]">
            {loadingBriefing ? (
              <div className="flex items-center gap-3 text-[var(--text-secondary)] font-mono text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
                <span>Initializing neural link...</span>
              </div>
            ) : briefingError ? (
              <div className="flex items-center gap-3 text-[var(--red)] font-mono text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>&gt; Error: {briefingError}. Check Edge Function logs.</span>
              </div>
            ) : briefing ? (
              <div className="font-mono text-sm">
                <span className="text-[var(--accent)]">&gt; </span>
                <span className="text-[var(--text-primary)]">{briefing.summary}</span>
                {briefing.forgottenNote && (
                  <button
                    onClick={() => navigate(`/wiki/${briefing.forgottenNote!.slug}`)}
                    className="flex items-center gap-2 mt-3 px-3 py-1.5 bg-[var(--accent-soft)] border border-[var(--accent)]/30 rounded hover:bg-[var(--accent)] hover:text-white transition-colors w-fit"
                  >
                    <Lightbulb className="w-3 h-3 text-[var(--yellow)]" />
                    <span className="text-[var(--accent)]">Review: {briefing.forgottenNote.title}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-[var(--text-tertiary)] font-mono text-sm">
                <Terminal className="w-4 h-4" />
                <span>&gt; Awaiting input... Configure API key to enable.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MIDDLE: 4-Column Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/inbox')}
          className="p-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] hover:bg-[var(--bg-surface)] transition-all group text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-[var(--green)]/10 rounded-lg">
              <Lightbulb className="w-5 h-5 text-[var(--green)]" />
            </div>
            {inboxCount > 0 && (
              <span className="px-2 py-0.5 bg-[var(--accent)] text-white text-xs font-mono rounded">{inboxCount}</span>
            )}
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{inboxCount}</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Inbox</p>
        </button>

        <button
          onClick={() => navigate('/tasks')}
          className="p-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] hover:bg-[var(--bg-surface)] transition-all group text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-[var(--blue)]/10 rounded-lg">
              <CheckSquare className="w-5 h-5 text-[var(--blue)]" />
            </div>
            {highPriorityTasks.length > 0 && (
              <span className="px-2 py-0.5 bg-[var(--red)] text-white text-xs font-mono rounded">{highPriorityTasks.length}</span>
            )}
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{activeTasks.length}</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Active Tasks</p>
        </button>

        <button
          onClick={() => navigate('/wiki')}
          className="p-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] hover:bg-[var(--bg-surface)] transition-all group text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
              <FileText className="w-5 h-5 text-[var(--accent)]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{wikiPages.length}</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Wiki Pages</p>
        </button>

        <button
          onClick={() => navigate('/journal')}
          className="p-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] hover:bg-[var(--bg-surface)] transition-all group text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-[var(--blue)]/10 rounded-lg">
              <BookOpen className="w-5 h-5 text-[var(--blue)]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{journalEntries.length}</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Journal Entries</p>
        </button>
      </div>

      {/* BOTTOM: 2-Column Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Today's Schedule */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-[var(--blue)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Today's Schedule</h2>
          </div>
          
          {todayBlocks.length > 0 ? (
            <div className="space-y-2">
              {todayBlocks
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .slice(0, 5)
                .map((block, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-3 p-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded hover:border-[var(--accent)]/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-[var(--accent)] font-mono text-xs w-16">
                      <Clock className="w-3 h-3" />
                      {block.startTime}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text-primary)] text-sm truncate">{block.title}</p>
                      {block.location && (
                        <p className="text-xs text-[var(--text-tertiary)] truncate">{block.location}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[var(--text-tertiary)] text-sm font-mono py-4">
              <span>&gt; No classes scheduled</span>
            </div>
          )}
        </div>

        {/* Right: Urgent Tasks */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[var(--red)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Urgent Tasks</h2>
          </div>
          
          {highPriorityTasks.length > 0 ? (
            <div className="space-y-2">
              {highPriorityTasks.slice(0, 4).map(task => (
                <button 
                  key={task.id}
                  onClick={() => navigate('/tasks')}
                  className="flex items-center justify-between w-full p-2 bg-[var(--bg-surface)] border border-[var(--red)]/30 rounded hover:border-[var(--red)] hover:bg-[var(--red)]/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-[var(--red)] flex-shrink-0" />
                    <span className="text-[var(--text-primary)] text-sm truncate">{task.title}</span>
                  </div>
                  {task.dueDate && (
                    <span className="text-xs text-[var(--text-tertiary)] font-mono flex-shrink-0">{task.dueDate}</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[var(--text-tertiary)] text-sm font-mono py-4">
              <span>&gt; No urgent tasks</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}