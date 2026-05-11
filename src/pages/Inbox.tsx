import { useState, useEffect } from 'react'
import { useNotesStore } from '../store'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { formatRelativeDate, truncate } from '../lib/utils'
import { Archive, Trash2, Plus, Lightbulb } from 'lucide-react'

export default function Inbox() {
  const { items, loading, fetchAll, add, update, delete: deleteNote, getInboxCount } = useNotesStore()
  const [newNote, setNewNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const handleCapture = async () => {
    if (!newNote.trim() || submitting) return
    
    setSubmitting(true)
    try {
      await add({
        content: newNote.trim(),
        createdAt: new Date(),
        status: 'inbox',
      })
      setNewNote('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCapture()
    }
  }

  const handleArchive = async (id: number) => {
    await update(id, { status: 'processed' })
  }

  const handleDelete = async (id: number) => {
    await deleteNote(id)
  }

  const inboxNotes = items.filter(n => n.status === 'inbox')
  const inboxCount = getInboxCount()

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Inbox</h1>
          {inboxCount > 0 && (
            <span className="px-2.5 py-1 bg-[var(--accent-soft)] text-[var(--accent)] text-sm rounded-full">
              {inboxCount} new
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <Input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Capture a thought..."
            className="flex-1 text-lg py-3"
            disabled={submitting}
          />
          <Button onClick={handleCapture} disabled={!newNote.trim() || submitting}>
            <Plus className="w-4 h-4 mr-2" />
            Capture
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center text-[var(--text-secondary)] py-8">Loading...</div>
        ) : inboxNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 mb-6 rounded-full bg-[var(--bg-surface)] flex items-center justify-center">
              <Lightbulb className="w-10 h-10 text-[var(--text-tertiary)]" />
            </div>
            <h2 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              Nothing here yet
            </h2>
            <p className="text-[var(--text-secondary)] max-w-sm">
              Capture a thought — it takes 3 seconds. Your ideas will appear here for AI processing.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {inboxNotes.map((note) => (
              <div
                key={note.id}
                className="group p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg hover:border-[var(--border-hover)] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-primary)] whitespace-pre-wrap">
                      {truncate(note.content, 200)}
                    </p>
                    <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                      {formatRelativeDate(note.createdAt)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => note.id && handleArchive(note.id)}
                      className="p-2 text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--bg-elevated)] rounded-md transition-colors"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => note.id && handleDelete(note.id)}
                      className="p-2 text-[var(--text-tertiary)] hover:text-[var(--red)] hover:bg-[var(--bg-elevated)] rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}