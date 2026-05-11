import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestBody {
  prompt: string
  context: {
    wikiPages: { id: number; title: string; slug: string; content: string }[]
    journalEntries: { id: number; date: string; content: string }[]
    tasks: { id: number; title: string; status: string; priority: string; dueDate?: string }[]
    timetableBlocks: { title: string; dayOfWeek: number; startTime: string; endTime: string }[]
    protocolEntries: { id: number; category: string; content: string }[]
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, context } = await req.json() as RequestBody

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing prompt' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const nvidiaApiKey = Deno.env.get('NVIDIA_API_KEY')
    if (!nvidiaApiKey) {
      return new Response(
        JSON.stringify({ error: 'NVIDIA_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const wikiContext = context?.wikiPages
      ?.map((p: any) => `## ${p.title}\n${p.content.slice(0, 500)}`)
      .join('\n\n') || ''

    const journalContext = context?.journalEntries
      ?.slice(0, 10)
      .map((e: any) => `## ${e.date}\n${e.content.replace(/<[^>]*>/g, '').slice(0, 300)}`)
      .join('\n\n') || ''

    const tasksContext = context?.tasks
      ?.filter((t: any) => t.status !== 'done')
      .map((t: any) => `- [${t.priority.toUpperCase()}] ${t.title}${t.dueDate ? ` (due: ${t.dueDate})` : ''}`)
      .join('\n') || ''

    const today = new Date().getDay()
    const todayBlocks = context?.timetableBlocks?.filter((b: any) => b.dayOfWeek === today) || []
    const timetableContext = todayBlocks
      .map((b: any) => `- ${b.startTime}-${b.endTime}: ${b.title}`)
      .join('\n') || ''

    const protocolContext = context?.protocolEntries
      ?.slice(0, 20)
      .map((p: any) => `- ${p.category}: ${p.content}`)
      .join('\n') || ''

    const systemPrompt = `You are Cortex, the user's AI second brain. Answer questions based on their entire life-OS data.

## WIKI PAGES (knowledge base)
${wikiContext || '(none)'}

## JOURNAL ENTRIES (reflections)
${journalContext || '(none)'}

## TASKS (${context?.tasks?.filter((t: any) => t.status !== 'done').length || 0} active)
${tasksContext || '(none)'}

## TIMETABLE (today)
${timetableContext || '(none)'}

## PROTOCOL (self-knowledge)
${protocolContext || '(none)'}

User question: "${prompt}"

Return ONLY valid JSON with this structure:
{
  "answer": "your conversational answer",
  "sources": [{"type": "wiki|journal|task", "id": "id", "title": "source title", "snippet": "relevant excerpt (max 100 chars)"}],
  "suggestedActions": [{"label": "button text", "action": "goto-tasks|goto-wiki|goto-journal|goto-timetable|custom", "page": "optional slug"}]
}

Include sources from all data types. If the question asks about tasks, include 'goto-tasks' action. If about wiki, include 'goto-wiki'.`

    const nvidiaRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nvidiaApiKey}`,
      },
      body: JSON.stringify({
        model: 'minimaxai/minimax-m2.7',
        messages: [{ role: 'system', content: systemPrompt }],
      }),
    })

    if (!nvidiaRes.ok) {
      const errorText = await nvidiaRes.text()
      throw new Error(`NVIDIA API error (${nvidiaRes.status}): ${errorText}`)
    }

    const data = await nvidiaRes.json()
    const result = data.choices?.[0]?.message?.content ?? '{}'

    let parsed: any = {}
    try {
      parsed = JSON.parse(result.replace(/```json|```/g, '').trim())
    } catch {
      parsed = { answer: result, sources: [] }
    }

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})