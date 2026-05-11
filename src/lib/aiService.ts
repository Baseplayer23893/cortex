import { useSettingsStore } from '../store'

export interface AnalysisResult {
  summary: string
  suggestedLinks: string[]
  suggestedTags: string[]
  extractedSections?: {
    title: string
    content: string
  }[]
}

export async function analyzeWikiContent(
  content: string,
  currentTitle: string,
  existingPages: { title: string; slug: string; content: string }[]
): Promise<AnalysisResult> {
  const { apiKey, apiBaseUrl, aiModel } = useSettingsStore.getState()

  if (!apiKey || !content) {
    return { summary: '', suggestedLinks: [], suggestedTags: [] }
  }

  const pageList = existingPages
    .filter(p => p.title !== currentTitle)
    .map(p => `- ${p.title}: ${p.content.slice(0, 100)}`)
    .join('\n')

  const prompt = `You are analyzing a wiki note. 
Current note title: "${currentTitle}"
Current note content:
${content}

Existing wiki pages:
${pageList || '(none)'}

Return ONLY valid JSON with this structure:
{
  "summary": "one sentence summary of this note",
  "suggestedLinks": ["list of existing wiki page titles that are semantically related (even if not explicitly mentioned)"],
  "suggestedTags": ["relevant tags for this content"],
  "extractedSections": [{"title": "suggested sub-page title", "content": "the content that should be extracted (if any section is 200+ words)"}]
}

Focus on finding semantic connections even when titles don't match exactly.`

  const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl
  
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [{ role: 'system', content: prompt }],
      }),
    })

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`)
    }

    const data = await res.json()
    const result = data.choices?.[0]?.message?.content ?? '{}'
    
    try {
      return JSON.parse(result.replace(/```json|```/g, '').trim())
    } catch {
      return { summary: '', suggestedLinks: [], suggestedTags: [] }
    }
  } catch (error) {
    console.error('AI analysis error:', error)
    return { summary: '', suggestedLinks: [], suggestedTags: [] }
  }
}

export async function findBacklinks(
  currentTitle: string,
  currentSlug: string,
  allPages: { title: string; slug: string; content: string }[]
): Promise<{ title: string; slug: string }[]> {
  const backlinks: { title: string; slug: string }[] = []
  const searchTerm = currentTitle.toLowerCase()
  const searchSlug = currentSlug.toLowerCase()

  allPages.forEach(page => {
    if (page.slug === currentSlug) return
    
    const content = page.content.toLowerCase()
    const titleMatch = content.includes(searchTerm)
    const slugMatch = content.includes(searchSlug)
    
    if (titleMatch || slugMatch) {
      backlinks.push({ title: page.title, slug: page.slug })
    }
  })

  return backlinks
}

export interface BrainSource {
  type: 'wiki' | 'journal' | 'task'
  id: string | number
  title: string
  snippet: string
}

export interface BrainResponse {
  answer: string
  sources: BrainSource[]
  suggestedActions?: {
    label: string
    action: 'goto-tasks' | 'goto-wiki' | 'goto-journal' | 'goto-timetable' | string
    page?: string
  }[]
}

export async function queryBrain(
  question: string,
  context: {
    wikiPages: { id: number; title: string; slug: string; content: string }[]
    journalEntries: { id: number; date: string; content: string }[]
    tasks: { id: number; title: string; status: string; priority: string; dueDate?: string }[]
    timetableBlocks: { title: string; dayOfWeek: number; startTime: string; endTime: string }[]
    protocolEntries: { id: number; category: string; content: string }[]
  }
): Promise<BrainResponse> {
  const { apiKey, apiBaseUrl, aiModel } = useSettingsStore.getState()

  if (!apiKey) {
    return { answer: 'No API key configured. Add one in Settings.', sources: [] }
  }

  const wikiContext = context.wikiPages
    .map(p => `## ${p.title}\n${p.content.slice(0, 500)}`)
    .join('\n\n')

  const journalContext = context.journalEntries
    .slice(0, 10)
    .map(e => `## ${e.date}\n${e.content.replace(/<[^>]*>/g, '').slice(0, 300)}`)
    .join('\n\n')

  const tasksContext = context.tasks
    .filter(t => t.status !== 'done')
    .map(t => `- [${t.priority.toUpperCase()}] ${t.title}${t.dueDate ? ` (due: ${t.dueDate})` : ''}`)
    .join('\n')

  const today = new Date().getDay()
  const todayBlocks = context.timetableBlocks.filter(b => b.dayOfWeek === today)
  const timetableContext = todayBlocks
    .map(b => `- ${b.startTime}-${b.endTime}: ${b.title}`)
    .join('\n')

  const protocolContext = context.protocolEntries
    .slice(0, 20)
    .map(p => `- ${p.category}: ${p.content}`)
    .join('\n')

  const prompt = `You are Cortex, the user's AI second brain. Answer questions based on their entire life-OS data.

## WIKI PAGES (knowledge base)
${wikiContext || '(none)'}

## JOURNAL ENTRIES (reflections)
${journalContext || '(none)'}

## TASKS (${context.tasks.filter(t => t.status !== 'done').length} active)
${tasksContext || '(none)'}

## TIMETABLE (today)
${timetableContext || '(none)'}

## PROTOCOL (self-knowledge)
${protocolContext || '(none)'}

User question: "${question}"

Return ONLY valid JSON with this structure:
{
  "answer": "your conversational answer",
  "sources": [{"type": "wiki|journal|task", "id": "id", "title": "source title", "snippet": "relevant excerpt (max 100 chars)"}],
  "suggestedActions": [{"label": "button text", "action": "goto-tasks|goto-wiki|goto-journal|goto-timetable|custom", "page": "optional slug"}]
}

Include sources from all data types. If the question asks about tasks, include 'goto-tasks' action. If about wiki, include 'goto-wiki'.`

  const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [{ role: 'system', content: prompt }],
      }),
    })

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`)
    }

    const data = await res.json()
    const result = data.choices?.[0]?.message?.content ?? '{}'

    try {
      return JSON.parse(result.replace(/```json|```/g, '').trim())
    } catch {
      return { answer: result, sources: [] }
    }
  } catch (error) {
    console.error('Brain query error:', error)
    return { answer: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`, sources: [] }
  }
}

export async function generateDailyBriefing(
  context: {
    tasks: { id: number; title: string; priority: string; dueDate?: string }[]
    timetableBlocks: { title: string; dayOfWeek: number; startTime: string; endTime: string }[]
    wikiPages: { id: number; title: string; slug: string; content: string; updatedAt?: Date }[]
    journalEntries: { date: string; content: string }[]
  }
): Promise<{ summary: string; forgottenNote?: { title: string; slug: string } }> {
  const { apiKey, apiBaseUrl, aiModel } = useSettingsStore.getState()

  if (!apiKey) {
    return { summary: 'Add API key in Settings to enable daily briefings.' }
  }

  const today = new Date().getDay()
  const todayBlocks = context.timetableBlocks.filter(b => b.dayOfWeek === today)
  
  const upcomingTasks = context.tasks
    .filter(t => t.status !== 'done')
    .slice(0, 5)
    .map(t => `- ${t.priority}: ${t.title}`)

  const sortedByDate = [...context.wikiPages].sort((a, b) => {
    const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
    const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
    return dateA - dateB
  })
  
  const oldestNotes = sortedByDate.slice(0, 5)

  const prompt = `Generate a brief morning briefing for the user.

Today's schedule:
${todayBlocks.map(b => `${b.startTime}-${b.endTime}: ${b.title}`).join('\n') || '(none)'}

Upcoming tasks:
${upcomingTasks.join('\n') || '(none)'}

Notes not viewed recently (potential复习):
${oldestNotes.map(n => `- ${n.title}`).join('\n')}

Return ONLY valid JSON:
{
  "summary": "2-3 sentence summary of the day ahead",
  "forgottenNote": {"title": "note title", "slug": "note slug"} or null
}`

  const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [{ role: 'system', content: prompt }],
      }),
    })

    const data = await res.json()
    const result = data.choices?.[0]?.message?.content ?? '{}'
    return JSON.parse(result.replace(/```json|```/g, '').trim())
  } catch {
    return { summary: 'Unable to generate briefing.' }
  }
}