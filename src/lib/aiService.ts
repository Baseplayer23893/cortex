import { supabase } from './supabase'

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
  const prompt = `You are analyzing a wiki note. 
Current note title: "${currentTitle}"
Current note content:
${content}

Existing wiki pages:
${(existingPages || [])
  .filter(p => p.title !== currentTitle)
  .map(p => `- ${p.title}: ${(p.content || '').slice(0, 100)}`)
  .join('\n') || '(none)'}

Return ONLY valid JSON with this structure:
{
  "summary": "one sentence summary of this note",
  "suggestedLinks": ["list of existing wiki page titles that are semantically related (even if not explicitly mentioned)"],
  "suggestedTags": ["relevant tags for this content"],
  "extractedSections": [{"title": "suggested sub-page title", "content": "the content that should be extracted (if any section is 200+ words)"}]
}

Focus on finding semantic connections even when titles don't match exactly.`

  try {
    const { data, error } = await supabase.functions.invoke('cortex-brain', {
      body: { 
        prompt, 
        context: {
          wikiPages: (existingPages || []).filter(p => p.title !== currentTitle).map(p => ({
            id: 0,
            title: p.title,
            slug: p.slug,
            content: (p.content || '').slice(0, 500),
          })),
          journalEntries: [],
          tasks: [],
          timetableBlocks: [],
          protocolEntries: [],
        }
      },
    })

    if (error) {
      throw new Error(error.message || 'Function invocation failed')
    }

    return data as AnalysisResult
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
  const searchTerm = (currentTitle || '').toLowerCase()
  const searchSlug = (currentSlug || '').toLowerCase()

  ;(allPages || []).forEach(page => {
    if (page.slug === currentSlug) return
    
    const content = (page.content || '').toLowerCase()
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
  try {
    const { data, error } = await supabase.functions.invoke('cortex-brain', {
      body: { prompt: question, context },
    })

    if (error) {
      throw new Error(error.message || 'Function invocation failed')
    }

    return data as BrainResponse
  } catch (error) {
    console.error('Brain query error:', error)
    return { 
      answer: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`, 
      sources: [] 
    }
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
  const prompt = `Generate a brief morning briefing for the user.

Today's schedule:
${context.timetableBlocks.filter(b => b.dayOfWeek === new Date().getDay()).map(b => `${b.startTime}-${b.endTime}: ${b.title}`).join('\n') || '(none)'}

Upcoming tasks:
${context.tasks.filter(t => t.status !== 'done').slice(0, 5).map(t => `- ${t.priority}: ${t.title}`).join('\n') || '(none)'}

Notes not viewed recently:
${[...context.wikiPages].sort((a, b) => {
  const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
  const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
  return dateA - dateB
}).slice(0, 5).map(n => `- ${n.title}`).join('\n')}

Return ONLY valid JSON:
{
  "summary": "2-3 sentence summary of the day ahead",
  "forgottenNote": {"title": "note title", "slug": "note slug"} or null
}`

  try {
    const { data, error } = await supabase.functions.invoke('cortex-brain', {
      body: { 
        prompt, 
        context: {
          wikiPages: context.wikiPages.map(p => ({ ...p, content: '' })),
          journalEntries: [],
          tasks: context.tasks,
          timetableBlocks: context.timetableBlocks,
          protocolEntries: [],
        }
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    return data as { summary: string; forgottenNote?: { title: string; slug: string } }
  } catch {
    return { summary: 'Unable to generate briefing.' }
  }
}