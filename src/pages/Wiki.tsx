import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ForceGraph2D from 'react-force-graph-2d'
import { useWikiStore, useNotesStore, useJournalStore, useSettingsStore } from '../store'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { format, formatDistanceToNow } from 'date-fns'
import { 
  ChevronRight, ChevronDown, Plus, FileText, Folder, 
  FolderOpen, Search, Network, List, Edit3, Trash2, 
  Brain, Loader2, Link2, Sparkles
} from 'lucide-react'
import { formatDate, slugify } from '../lib/utils'
import { analyzeWikiContent, findBacklinks } from '../lib/aiService'

interface TreeNode {
  id: string
  title: string
  slug: string
  type: 'folder' | 'page'
  children?: TreeNode[]
  parentId?: string
}

const WIKI_TEMPLATE = `---
title: {{title}}
date: {{date}}
tags: []
---

# {{title}}

Write your notes here...

`

function buildTree(pages: { id?: number; title: string; slug: string }[]): TreeNode[] {
  return pages.map(page => ({
    id: page.slug,
    title: page.title,
    slug: page.slug,
    type: 'page' as const,
  }))
}

function WikiPageEditor({ 
  page, 
  onSave, 
  onDelete,
  onAnalyze,
  analyzing 
}: { 
  page: { id?: number; title: string; content: string; tags?: string[] }
  onSave: (content: string) => void
  onDelete?: () => void
  onAnalyze?: () => void
  analyzing?: boolean
}) {
  const [content, setContent] = useState(page.content || '')

  useEffect(() => {
    setContent(page.content || '')
  }, [page.slug])

  const handleSave = () => {
    onSave(content)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <input
          value={page.title}
          readOnly
          className="text-xl font-semibold bg-transparent border-none outline-none text-[var(--text-primary)]"
        />
        <div className="flex gap-2">
          {onAnalyze && (
            <Button size="sm" variant="secondary" onClick={onAnalyze} disabled={analyzing}>
              {analyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              <Sparkles className="w-3 h-3 ml-1" />
            </Button>
          )}
          <Button size="sm" onClick={handleSave}>Save</Button>
          {onDelete && (
            <Button size="sm" variant="danger" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 p-4 bg-[var(--bg-base)] text-[var(--text-primary)] font-mono text-sm resize-none outline-none"
        placeholder="Start writing..."
      />
    </div>
  )
}

function GraphView({ onNodeClick }: { onNodeClick: (type: string, id: string) => void }) {
  const { items: wikiPages } = useWikiStore()
  const { items: notes } = useNotesStore()
  const { items: journalEntries } = useJournalStore()

  const graphRef = useRef<any>(null)

  const nodes = useMemo(() => {
    const nodeList: { id: string; name: string; type: string; val: number }[] = []

    wikiPages.forEach(page => {
      nodeList.push({
        id: `wiki-${page.slug}`,
        name: page.title,
        type: 'wiki',
        val: 20,
      })
    })

    journalEntries.forEach(entry => {
      nodeList.push({
        id: `journal-${entry.date}`,
        name: format(new Date(entry.date), 'MMM d, yyyy'),
        type: 'journal',
        val: 10,
      })
    })

    notes.filter(n => n.status === 'inbox').forEach(note => {
      nodeList.push({
        id: `inbox-${note.id}`,
        name: note.content.slice(0, 30),
        type: 'inbox',
        val: 8,
      })
    })

    return nodeList
  }, [wikiPages, journalEntries, notes])

  const links = useMemo(() => {
    const linkList: { source: string; target: string }[] = []

    wikiPages.forEach(page => {
      if (page.related) {
        page.related.forEach(slug => {
          linkList.push({
            source: `wiki-${page.slug}`,
            target: `wiki-${slug}`,
          })
        })
      }
    })

    notes.filter(n => n.status === 'inbox').forEach(note => {
      if (note.wikiLinks) {
        note.wikiLinks.forEach(slug => {
          linkList.push({
            source: `inbox-${note.id}`,
            target: `wiki-${slug}`,
          })
        })
      }
      if (note.relatedWikiSlug) {
        linkList.push({
          source: `inbox-${note.id}`,
          target: `wiki-${note.relatedWikiSlug}`,
        })
      }
    })

    return linkList
  }, [wikiPages, notes])

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'wiki': return '#7c3aed'
      case 'journal': return '#3b82f6'
      case 'inbox': return '#22c55e'
      default: return '#71717a'
    }
  }

  return (
    <div className="h-full w-full bg-[var(--bg-base)]">
      <ForceGraph2D
        ref={graphRef}
        graphData={{ nodes, links }}
        nodeLabel={(node: any) => `${node.name} (${node.type})`}
        nodeColor={(node: any) => getNodeColor(node.type)}
        nodeRelSize={6}
        linkColor={() => 'rgba(124, 58, 237, 0.4)'}
        linkWidth={1}
        backgroundColor="#0e0e10"
        onNodeClick={(node: any) => onNodeClick(node.type, node.id)}
        cooldownTicks={100}
        d3VelocityDecay={0.2}
      />
      <div className="absolute bottom-4 left-4 flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#7c3aed]" />
          <span className="text-[var(--text-secondary)]">Wiki</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
          <span className="text-[var(--text-secondary)]">Journal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
          <span className="text-[var(--text-secondary)]">Inbox</span>
        </div>
      </div>
    </div>
  )
}

export default function Wiki() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { items, fetchAll, create, update, delete: deletePage, getBySlug } = useWikiStore()
  const { apiKey } = useSettingsStore()
  const [view, setView] = useState<'list' | 'graph'>('list')
  const [search, setSearch] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [newPageTitle, setNewPageTitle] = useState('')
  const [showNewPage, setShowNewPage] = useState(false)
  const [currentPage, setCurrentPage] = useState<{ id?: number; title: string; content: string; tags?: string[]; related?: string[] } | null>(null)
  
  const [analyzing, setAnalyzing] = useState(false)
  const [relatedNotes, setRelatedNotes] = useState<{ title: string; slug: string }[]>([])
  const [backlinks, setBacklinks] = useState<{ title: string; slug: string }[]>([])
  const [aiSummary, setAiSummary] = useState('')
  const [showExtractModal, setShowExtractModal] = useState(false)
  const [extractSuggestion, setExtractSuggestion] = useState<{ title: string; content: string } | null>(null)

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    if (slug) {
      getBySlug(slug).then(page => {
        if (page) {
          setCurrentPage(page)
        }
      })
    } else if (items.length > 0 && !currentPage) {
      setCurrentPage(items[0])
    }
  }, [slug, items])

  useEffect(() => {
    if (currentPage?.title && items.length > 0) {
      findBacklinks(currentPage.title, currentPage.slug || slugify(currentPage.title), items)
        .then(setBacklinks)
    }
  }, [currentPage?.title, items])

  const filteredPages = items.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreatePage = async () => {
    if (!newPageTitle.trim()) return
    const now = new Date()
    const content = WIKI_TEMPLATE
      .replace('{{title}}', newPageTitle.trim())
      .replace('{{title}}', newPageTitle.trim())
      .replace('{{date}}', format(now, 'yyyy-MM-dd'))

    await create(newPageTitle.trim(), content)
    setNewPageTitle('')
    setShowNewPage(false)
  }

  const handleSavePage = async (content: string) => {
    if (currentPage?.id) {
      await update(currentPage.id, { content })
    }
  }

  const handleDeletePage = async () => {
    if (currentPage?.id) {
      await deletePage(currentPage.id)
      setCurrentPage(items[0] || null)
    }
  }

  const handleAnalyze = async () => {
    if (!currentPage || !apiKey) return
    
    setAnalyzing(true)
    try {
      const result = await analyzeWikiContent(
        currentPage.content,
        currentPage.title,
        items
      )
      
      if (result.suggestedLinks?.length > 0) {
        const linked = result.suggestedLinks
          .map(title => items.find(p => p.title === title))
          .filter(Boolean) as { title: string; slug: string }[]
        setRelatedNotes(linked)
      }
      
      if (result.summary) {
        setAiSummary(result.summary)
      }
      
      if (result.extractedSections?.length > 0) {
        setExtractSuggestion(result.extractedSections[0])
        setShowExtractModal(true)
      }
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleExtractSection = async () => {
    if (!extractSuggestion) return
    
    const now = new Date()
    const content = WIKI_TEMPLATE
      .replace('{{title}}', extractSuggestion.title)
      .replace('{{title}}', extractSuggestion.title)
      .replace('{{date}}', format(now, 'yyyy-MM-dd'))
      + `\n\n${extractSuggestion.content}`

    await create(extractSuggestion.title, content)
    setShowExtractModal(false)
    setExtractSuggestion(null)
  }

  const handleNodeClick = useCallback((type: string, id: string) => {
    if (type === 'wiki') {
      const pageSlug = id.replace('wiki-', '')
      navigate(`/wiki/${pageSlug}`)
    } else if (type === 'journal') {
      const date = id.replace('journal-', '')
      navigate(`/journal`)
    } else if (type === 'inbox') {
      navigate('/inbox')
    }
  }, [navigate])

  const tree = buildTree(filteredPages)

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Explorer */}
      <div className="w-64 border-r border-[var(--border)] bg-[var(--bg-surface)] flex flex-col">
        <div className="p-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Explorer</h2>
            {apiKey && (
              <Brain className={`w-4 h-4 text-[var(--accent)] ${analyzing ? 'animate-pulse' : ''}`} />
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pages..."
              className="w-full pl-8 pr-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {/* View Toggle */}
          <div className="flex gap-1 mb-3 p-1 bg-[var(--bg-elevated)] rounded">
            <button
              onClick={() => setView('list')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 text-xs rounded ${view === 'list' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)]'}`}
            >
              <List className="w-3 h-3" />
              List
            </button>
            <button
              onClick={() => setView('graph')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 text-xs rounded ${view === 'graph' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)]'}`}
            >
              <Network className="w-3 h-3" />
              Graph
            </button>
          </div>

          {view === 'list' ? (
            <>
              {/* New Page Button */}
              {!showNewPage ? (
                <button
                  onClick={() => setShowNewPage(true)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Page
                </button>
              ) : (
                <div className="p-2 mb-2 bg-[var(--bg-elevated)] rounded">
                  <Input
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    placeholder="Page title"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={handleCreatePage}>Create</Button>
                    <Button size="sm" variant="secondary" onClick={() => setShowNewPage(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              {/* Page List */}
              {tree.map(node => (
                <div key={node.id}>
                  <button
                    onClick={() => navigate(`/wiki/${node.slug}`)}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded transition-colors ${
                      currentPage?.title === node.title
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="truncate">{node.title}</span>
                  </button>
                </div>
              ))}
            </>
          ) : (
            <div className="h-[400px]">
              <GraphView onNodeClick={handleNodeClick} />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {view === 'graph' ? (
          <div className="flex-1">
            <GraphView onNodeClick={handleNodeClick} />
          </div>
        ) : currentPage ? (
          <div className="flex-1 flex flex-col">
            <WikiPageEditor
              page={currentPage}
              onSave={handleSavePage}
              onDelete={handleDeletePage}
              onAnalyze={apiKey ? handleAnalyze : undefined}
              analyzing={analyzing}
            />
            
            {/* AI Summary */}
            {aiSummary && (
              <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--bg-surface)]">
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <Brain className="w-3 h-3 text-[var(--accent)]" />
                  <span>{aiSummary}</span>
                </div>
              </div>
            )}

            {/* Related Notes */}
            {relatedNotes.length > 0 && (
              <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--bg-surface)]">
                <div className="text-xs font-medium text-[var(--text-tertiary)] mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Related Notes
                </div>
                <div className="flex flex-wrap gap-2">
                  {relatedNotes.map(note => (
                    <button
                      key={note.slug}
                      onClick={() => navigate(`/wiki/${note.slug}`)}
                      className="px-2 py-1 text-xs bg-[var(--accent-soft)] text-[var(--accent)] rounded hover:bg-[var(--accent)] hover:text-white transition-colors"
                    >
                      {note.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Backlinks Footer */}
            {backlinks.length > 0 && (
              <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--bg-elevated)]">
                <div className="text-xs font-medium text-[var(--text-tertiary)] mb-1 flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  Linked Mentions ({backlinks.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {backlinks.map(link => (
                    <button
                      key={link.slug}
                      onClick={() => navigate(`/wiki/${link.slug}`)}
                      className="px-2 py-1 text-xs bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border)] rounded hover:border-[var(--accent)] transition-colors"
                    >
                      {link.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)]">No page selected</p>
              <Button 
                className="mt-4" 
                onClick={() => setShowNewPage(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Page
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Extract Section Modal */}
      {showExtractModal && extractSuggestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg w-[500px] p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              Extract as Sub-page?
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              The AI identified this section that could be its own page:
            </p>
            <div className="p-3 bg-[var(--bg-elevated)] rounded mb-3">
              <p className="text-sm font-medium text-[var(--accent)] mb-1">{extractSuggestion.title}</p>
              <p className="text-xs text-[var(--text-secondary)] line-clamp-3">{extractSuggestion.content}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExtractSection}>Extract</Button>
              <Button variant="secondary" onClick={() => setShowExtractModal(false)}>Skip</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}