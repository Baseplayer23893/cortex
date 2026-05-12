import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore, useNotesStore, useWikiStore, useJournalStore, useTasksStore, useTimetableStore, useProtocolStore } from '../store'
import { queryBrain, type BrainResponse, type BrainSource } from '../lib/aiService'
import Button from '../components/ui/Button'
import { format } from 'date-fns'
import { 
  Send, Brain as BrainIcon, Loader2, Terminal, 
  FileText, BookOpen, CheckSquare, Calendar, 
  ExternalLink, Sparkles, ChevronRight
} from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: BrainSource[]
  suggestedActions?: BrainResponse['suggestedActions']
}

export default function AIBrain() {
  const navigate = useNavigate()
  const { apiKey, userName } = useSettingsStore()
  const { items: notes } = useNotesStore()
  const { items: wikiPages, fetchAll: fetchWiki } = useWikiStore()
  const { items: journalEntries } = useJournalStore()
  const { items: tasks, fetchAll: fetchTasks } = useTasksStore()
  const { items: timetableBlocks, fetchAll: fetchTimetable } = useTimetableStore()
  const { items: protocolEntries, fetchAll: fetchProtocol } = useProtocolStore()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchWiki()
    fetchTasks()
    fetchTimetable()
    fetchProtocol()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

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
      const response: BrainResponse = await queryBrain(input, {
        wikiPages: wikiPages.map(p => ({ id: p.id!, title: p.title, slug: p.slug, content: p.content })),
        journalEntries: journalEntries.map(e => ({ id: e.id!, date: e.date, content: e.content })),
        tasks: tasks.map(t => ({ id: t.id!, title: t.title, status: t.status, priority: t.priority, dueDate: t.dueDate })),
        timetableBlocks: timetableBlocks.map(b => ({ title: b.title, dayOfWeek: b.dayOfWeek, startTime: b.startTime, endTime: b.endTime })),
        protocolEntries: protocolEntries.map(p => ({ id: p.id!, category: p.category, content: p.content })),
      })

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources,
        suggestedActions: response.suggestedActions,
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

  const handleAction = (action: string, page?: string) => {
    switch (action) {
      case 'goto-tasks':
        navigate('/tasks')
        break
      case 'goto-wiki':
        if (page) navigate(`/wiki/${page}`)
        else navigate('/wiki')
        break
      case 'goto-journal':
        navigate('/journal')
        break
      case 'goto-timetable':
        navigate('/timetable')
        break
      default:
        break
    }
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'wiki': return <FileText className="w-3 h-3" />
      case 'journal': return <BookOpen className="w-3 h-3" />
      case 'task': return <CheckSquare className="w-3 h-3" />
      default: return <FileText className="w-3 h-3" />
    }
  }

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <BrainIcon className="w-16 h-16 text-[var(--accent)] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">AI Brain</h2>
          <p className="text-[var(--text-secondary)] mb-4">
            Your AI Brain is connected via NVIDIA NIM. Configure your API key in Settings for additional AI providers.
          </p>
          <Button onClick={() => navigate('/settings')}>Configure AI</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
        <Terminal className="w-5 h-5 text-[var(--accent)]" />
        <div>
          <h1 className="text-xl font-semibold">Cortex Brain</h1>
          <p className="text-xs text-[var(--text-tertiary)]">Query your entire life-OS</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-block p-4 border border-[var(--accent)] rounded-lg bg-[var(--accent-soft)] text-left">
              <p className="text-sm text-[var(--accent)] mb-2">&gt; Cortex v1.0 initialized</p>
              <p className="text-xs text-[var(--text-secondary)]">
                I have access to:<br/>
                • {wikiPages.length} wiki pages<br/>
                • {journalEntries.length} journal entries<br/>
                • {tasks.filter(t => t.status !== 'done').length} active tasks<br/>
                • {protocolEntries.length} protocol entries
              </p>
              <p className="text-sm text-[var(--accent)] mt-2">&gt; Ask me anything about your data...</p>
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-lg font-mono text-sm ${
                msg.role === 'user' 
                  ? 'bg-[var(--accent)] text-white' 
                  : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)]'
              }`}>
                <div className="text-xs opacity-50 mb-2">
                  {msg.role === 'user' ? '> user' : '> cortex'}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Suggested Actions */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[var(--border)]">
                    <p className="text-xs text-[var(--text-tertiary)] mb-2">Quick actions:</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.suggestedActions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => handleAction(action.action, action.page)}
                          className="px-2 py-1 text-xs bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-1"
                        >
                          {action.label}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[var(--border)]">
                    <p className="text-xs text-[var(--text-tertiary)] mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Sources:
                    </p>
                    <div className="space-y-1">
                      {msg.sources.map((source, i) => (
                        <div 
                          key={i}
                          className="text-xs flex items-start gap-2 text-[var(--text-secondary)] bg-[var(--bg-elevated)] p-2 rounded"
                        >
                          <span className="text-[var(--accent)] mt-0.5">{getSourceIcon(source.type)}</span>
                          <div>
                            <span className="text-[var(--text-primary)]">{source.title}</span>
                            <span className="ml-2 opacity-70">— {source.snippet}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
            placeholder="Ask about your wiki, tasks, journal..."
            className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
            disabled={loading}
          />
          <Button size="sm" onClick={handleSend} disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}