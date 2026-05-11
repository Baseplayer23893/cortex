import { useSettingsStore } from '../store'

function getApiUrl(path: string): string {
  const { apiBaseUrl } = useSettingsStore.getState()
  
  if (apiBaseUrl.includes('api.nvidia.com') || apiBaseUrl.includes('nim')) {
    return `/api/nvidia${path}`
  }
  
  const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl
  return `${baseUrl}${path}`
}

export async function callAI(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  onChunk?: (text: string) => void
): Promise<string> {
  const { apiKey, aiModel } = useSettingsStore.getState()

  if (!apiKey) {
    throw new Error('No API key set. Add one in Settings.')
  }

  const url = getApiUrl('/chat/completions')

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getModel(),
      stream: !!onChunk,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`API error (${res.status}): ${errorText}`)
  }

  if (onChunk && res.body) {
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let full = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '))
      for (const line of lines) {
        if (line === 'data: [DONE]') continue
        try {
          const json = JSON.parse(line.slice(6))
          const chunk = json.choices?.[0]?.delta?.content ?? ''
          full += chunk
          onChunk(chunk)
        } catch {}
      }
    }
    return full
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

export const PROCESS_INBOX_PROMPT = `You are the user's personal knowledge manager. Here are their unprocessed inbox notes.
For each note:
1. Extract key concepts and create or update wiki pages (title + markdown content)
2. If the note contains anything personal (skill learned, decision made, goal set, pattern noticed), add a Protocol entry
Return ONLY a valid JSON object with shape: { "wikiUpdates": [{"slug": "", "title": "", "content": ""}], "protocolEntries": [{"category": "", "content": ""}] }
No explanation, no preamble. JSON only.`

export const BRAIN_CHAT_PROMPT = `You are Cortex, the user's second brain. You have access to their recent notes, wiki, protocol, and tasks.
Answer questions conversationally. Be direct. Reference specific notes or wiki pages when relevant.`

export const JOURNAL_PROMPT_PROMPT = `You are a thoughtful journaling assistant. Based on the user's recent journal entries and current date, generate a thoughtful reflection question to help them journal. Keep it brief (1-2 sentences), open-ended, and personal.`