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