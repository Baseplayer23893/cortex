import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore, useNotesStore, useWikiStore, useJournalStore, useTasksStore } from '../store'
import { callAI, BRAIN_CHAT_PROMPT } from '../lib/ai'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { format } from 'date-fns'
import { 
  Send, Zap, MessageSquare, Brain, BookOpen, 
  CheckSquare, Inbox, Loader2, Terminal, X 
} from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ProcessResult {
  title?: string
  tags?: string[]
  action?: 'task' | 'wiki' | 'none'
  wikiContent?: string
}

export default function AIBrain() {
  const navigate = useNavigate()
  const { apiKey, userName } = useSettingsStore()
  const { items: notes, update: updateNote } = useNotesStore()
  const { items: wikiPages } = useWikiStore()
  const { items: journalEntries } = useJournalStore()
  const { items: tasks } = useTasksStore()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [processingInbox, setProcessingInbox] = useState(false)
  const [showInboxSelector, setShowInboxSelector] = useState(false)
  const [selectedNote, setSelectedNote] = useState<number | null>(null)
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const inboxNotes = notes.filter(n => n.status === 'inbox')

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const buildContext = () => {
    let context = `You are Cortex, ${userName || 'the user'}'s AI second brain.\n\n`

    // Recent Wiki pages
    if (wikiPages.length > 0) {
      context += `=== WIKI PAGES ===\n`
      wikiPages.slice(0, 10).forEach(page => {
        context += `- ${page.title}: ${page.content.slice(0, 200)}...\n`
      })
      context += '\n'
    }

    // Recent Journal
    if (journalEntries.length > 0) {
      context += `=== JOURNAL ENTRIES ===\n`
      journalEntries.slice(0, 5).forEach(entry => {
        context += `- ${entry.date}: ${entry.content.replace(/<[^>]*>/g, '').slice(0, 150)}...\n`
      })
      context += '\n'
    }

    // Tasks
    const pendingTasks = tasks.filter(t => t.status !== 'done')
    if (pendingTasks.length > 0) {
      context += `=== ACTIVE TASKS ===\n`
      pendingTasks.slice(0, 10).forEach(task => {
        context += `- ${task.title} (${task.priority}, due: ${task.dueDate || 'no date'})\n`
      })
      context += '\n'
    }

    // Recent Inbox
    const recentNotes = notes.filter(n => n.status === 'inbox').slice(0, 5)
    if (recentNotes.length > 0) {
      context += `=== INBOX (unprocessed) ===\n`
      recentNotes.forEach(note => {
        context += `- ${note.content.slice(0, 100)}...\n`
      })
    }

    return context
  }

  const handleSend = async () => {
    if (!input.trim() || loading || !apiKey) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const context = buildContext()
      const fullPrompt = `${BRAIN_CHAT_PROMPT}\n\n=== CONTEXT ===\n${context}\n\n=== CONVERSATION ===\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}\nuser: ${input}`

      const response = await callAI(
        [{ role: 'user', content: input }],
        fullPrompt,
        (chunk) => {
          // Handle streaming if needed
        }
      )

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleProcessInbox = async () => {
    if (!apiKey || inboxNotes.length === 0) return
    setShowInboxSelector(true)
  }

  const processNote = async (noteId: number) => {
    setSelectedNote(noteId)
    setProcessingInbox(true)
    setProcessResult(null)

    const note = notes.find(n => n.id === noteId)
    if (!note) return

    try {
      const prompt = `Analyze this note and suggest what to do with it. Return ONLY JSON with this structure:
{
  "title": "suggested title",
  "tags": ["tag1", "tag2"],
  "action": "task" | "wiki" | "none",
  "wikiContent": "optional initial content if action is wiki"
}
Note content: ${note.content}`

      const result = await callAI(
        [],
        prompt
      )

      try {
        const parsed = JSON.parse(result.replace(/```json|```/g, '').trim())
        setProcessResult(parsed)
      } catch {
        setProcessResult({ action: 'none' })
      }
    } catch (error) {
      console.error('Processing error:', error)
    } finally {
      setProcessingInbox(false)
    }
  }

  const applyResult = async () => {
    if (!processResult || !selectedNote) return

    if (processResult.action === 'task') {
      navigate('/tasks')
    } else if (processResult.action === 'wiki' && processResult.title) {
      navigate(`/wiki?create=${encodeURIComponent(processResult.title)}`)
    }

    // Mark note as processed
    await updateNote(selectedNote, { status: 'processed' })
    
    setShowInboxSelector(false)
    setSelectedNote(null)
    setProcessResult(null)
  }

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <Brain className="w-16 h-16 text-[var(--accent)] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">AI Brain</h2>
          <p className="text-[var(--text-secondary)] mb-4">
            Add your API key in Settings to enable AI features.
          </p>
          <Button onClick={() => navigate('/settings')}>Go to Settings</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-[var(--accent)]" />
          <div>
            <h1 className="text-xl font-semibold">AI Brain</h1>
            <p className="text-xs text-[var(--text-tertiary)]">Terminal Mode</p>
          </div>
        </div>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleProcessInbox}
          disabled={inboxNotes.length === 0}
        >
          <Zap className="w-4 h-4 mr-2" />
          Process Inbox ({inboxNotes.length})
        </Button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-block p-4 border border-[var(--accent)] rounded-lg bg-[var(--accent-soft)]">
              <p className="text-sm text-[var(--accent)]">
                > Cortex v1.0 initialized<br/>
                > Context loaded: {wikiPages.length} wiki, {journalEntries.length} journal, {tasks.filter(t => t.status !== 'done').length} tasks<br/>
                > Ready for queries...
              </p>
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg font-mono text-sm ${
                msg.role === 'user' 
                  ? 'bg-[var(--accent)] text-white' 
                  : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)]'
              }`}>
                <div className="text-xs opacity-50 mb-1">
                  {msg.role === 'user' ? '> user' : '> cortex'}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-3 rounded-lg">
              <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex gap-2">
          <span className="text-[var(--accent)] font-mono">{'>'}</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask anything about your data..."
            className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
            disabled={loading}
          />
          <Button size="sm" onClick={handleSend} disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Inbox Processing Modal */}
      {showInboxSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg w-[500px] max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-semibold">Process Inbox</h3>
              <button onClick={() => setShowInboxSelector(false)}>
                <X className="w-5 h-5 text-[var(--text-tertiary)]" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[400px]">
              {inboxNotes.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-center py-4">No inbox items</p>
              ) : inboxNotes.map(note => (
                <div 
                  key={note.id}
                  className={`p-3 border border-[var(--border)] rounded mb-2 cursor-pointer hover:border-[var(--accent)] transition-colors ${selectedNote === note.id ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : ''}`}
                  onClick={() => note.id && processNote(note.id)}
                >
                  <p className="text-sm text-[var(--text-primary)] line-clamp-2">{note.content}</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {format(note.createdAt, 'MMM d, h:mm a')}
                  </p>
                </div>
              ))}
            </div>

            {processResult && (
              <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-elevated)]">
                <h4 className="text-sm font-medium mb-2">Suggested Actions:</h4>
                {processResult.title && (
                  <p className="text-sm">Title: <span className="text-[var(--accent)]">{processResult.title}</span></p>
                )}
                {processResult.tags && (
                  <p className="text-sm">Tags: {processResult.tags.join(', ')}</p>
                )}
                {processResult.action && (
                  <p className="text-sm">Action: <span className="text-[var(--green)]">{processResult.action}</span></p>
                )}
                <Button className="mt-3" onClick={applyResult}>Apply</Button>
              </div>
            )}

            {processingInbox && (
              <div className="p-4 border-t border-[var(--border)] text-center">
                <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin mx-auto" />
                <p className="text-sm text-[var(--text-secondary)] mt-2">Processing...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}