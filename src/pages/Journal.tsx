import { useState, useEffect, useCallback } from 'react'
import { useJournalStore } from '../store'
import { format, parse, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { ChevronLeft, ChevronRight, FileText, PenLine } from 'lucide-react'
import { debounce, formatDate, countWords, getTodayDateString } from '../lib/utils'
import Button from '../components/ui/Button'

const EDITOR_PLACEHOLDERS = [
  "What's on your mind today?",
  "How are you feeling?",
  "What did you learn today?",
  "What's one thing you're grateful for?",
  "What's on your mind?",
]

function getRandomPlaceholder(): string {
  return EDITOR_PLACEHOLDERS[Math.floor(Math.random() * EDITOR_PLACEHOLDERS.length)]
}

interface MiniCalendarProps {
  currentMonth: Date
  onMonthChange: (date: Date) => void
  selectedDate: string | null
  entryDates: string[]
  onSelectDate: (date: string) => void
}

function MiniCalendar({ currentMonth, onMonthChange, selectedDate, entryDates, onSelectDate }: MiniCalendarProps) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const today = getTodayDateString()

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-center mb-1">
        {weekDays.map((day, i) => (
          <div key={i} className="text-[var(--text-tertiary)]">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array(monthStart.getDay()).fill(null).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const hasEntry = entryDates.includes(dateStr)
          const isSelected = selectedDate === dateStr
          const isToday = dateStr === today

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`p-1.5 text-xs rounded transition-colors ${
                isSelected
                  ? 'bg-[var(--accent)] text-white'
                  : isToday
                  ? 'border border-[var(--accent)] text-[var(--accent)]'
                  : hasEntry
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        <button
          onClick={() => onSelectDate(today)}
          className="w-full py-1.5 text-xs text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded transition-colors"
        >
          Jump to Today
        </button>
      </div>
    </div>
  )
}

function JournalEditor({ 
  content, 
  onChange, 
  placeholder 
}: { 
  content: string
  onChange: (content: string) => void
  placeholder?: string
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || getRandomPlaceholder(),
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] font-mono text-sm',
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '')
    }
  }, [content])

  return (
    <div className="flex-1 overflow-y-auto">
      <EditorContent editor={editor} className="p-4" />
    </div>
  )
}

export default function Journal() {
  const { items, currentEntry, loading, fetchAll, getOrCreateEntry, updateEntry } = useJournalStore()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    const today = getTodayDateString()
    setSelectedDate(today)
    getOrCreateEntry(today)
  }, [])

  const handleSelectDate = async (date: string) => {
    setSelectedDate(date)
    await getOrCreateEntry(date)
  }

  const handleContentChange = useCallback(
    debounce(async (newContent: string) => {
      if (!currentEntry?.id) return
      setSaving(true)
      await updateEntry(currentEntry.id, newContent, countWords(newContent.replace(/<[^>]*>/g, ' ')))
      setSaving(false)
      setLastSaved(new Date())
    }, 1000),
    [currentEntry?.id]
  )

  const handleContentChangeImmediate = (content: string) => {
    handleContentChange(content)
  }

  const entryDates = items.map(e => e.date)

  const selectedDateObj = selectedDate ? parse(selectedDate, 'yyyy-MM-dd', new Date()) : new Date()

  return (
    <div className="flex h-full">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-[var(--border)] bg-[var(--bg-surface)] flex flex-col">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Journal</h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {saving ? 'Saving...' : lastSaved ? `Saved ${format(lastSaved, 'h:mm a')}` : 'Auto-saves'}
          </p>
        </div>

        <MiniCalendar
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          selectedDate={selectedDate}
          entryDates={entryDates}
          onSelectDate={handleSelectDate}
        />

        <div className="flex-1 overflow-y-auto p-3 border-t border-[var(--border)]">
          <h3 className="text-xs font-medium text-[var(--text-tertiary)] mb-2 uppercase tracking-wide">
            Previous Entries
          </h3>
          <div className="space-y-1">
            {items
              .filter(e => e.date !== selectedDate)
              .slice(0, 20)
              .map(entry => (
                <button
                  key={entry.id}
                  onClick={() => handleSelectDate(entry.date)}
                  className="w-full text-left px-2 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] rounded transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3 text-[var(--text-tertiary)]" />
                    <span>{formatDate(entry.date)}</span>
                  </div>
                  {entry.content && (
                    <div className="text-xs text-[var(--text-tertiary)] truncate ml-5">
                      {entry.content.replace(/<[^>]*>/g, '').slice(0, 50)}
                    </div>
                  )}
                </button>
              ))}
            {items.length === 0 && (
              <p className="text-xs text-[var(--text-tertiary)] text-center py-4">
                No entries yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col bg-[var(--bg-base)]">
        {/* Date Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PenLine className="w-5 h-5 text-[var(--accent)]" />
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {selectedDate ? formatDate(selectedDate) : 'Today'}
              </h1>
              {selectedDate === getTodayDateString() && (
                <span className="text-xs text-[var(--accent)]">Today</span>
              )}
            </div>
          </div>
          {currentEntry && (
            <div className="text-sm text-[var(--text-tertiary)]">
              {currentEntry.wordCount} words
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
              Loading...
            </div>
          ) : (
            <JournalEditor
              content={currentEntry?.content || ''}
              onChange={handleContentChangeImmediate}
            />
          )}
        </div>
      </div>
    </div>
  )
}