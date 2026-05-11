import { supabase } from './supabase'

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