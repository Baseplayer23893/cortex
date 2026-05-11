import { db } from '../db/db'
import { useSettingsStore, useWikiStore, useProtocolStore, useAILogsStore } from '../store'
import { slugify } from '../lib/utils'

const WIKI_TEMPLATE = `---
title: {{title}}
date: {{date}}
tags: []
related:
{{related}}
---

# {{title}}

{{content}}

`

const PROTOCOL_PAGE_SLUG = 'the-anson-protocol'

export async function processInboxItem(itemId: number): Promise<{ success: boolean; error?: string }> {
  const { apiKey, apiBaseUrl, aiModel } = useSettingsStore.getState()
  const wikiStore = useWikiStore.getState()
  const protocolStore = useProtocolStore.getState()
  const aiLogsStore = useAILogsStore.getState()

  if (!apiKey) {
    return { success: false, error: 'No API key configured' }
  }

  try {
    const note = await db.notes.get(itemId)
    if (!note) {
      return { success: false, error: 'Note not found' }
    }

    const existingPages = await db.wiki.toArray()
    
    const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl
    
    const prompt = `You are processing an inbox note. 

Inbox note content:
"${note.content}"

Existing wiki pages (for linking):
${existingPages.slice(0, 10).map(p => `- ${p.title}`).join('\n') || '(none)'}

Analyze the note and return ONLY a valid JSON object with this structure:
{
  "title": "suggested wiki page title (1-5 words, title case)",
  "keyIdeas": ["idea 1", "idea 2", "idea 3"],
  "relatedPageSlugs": ["exact slug of first related page", "exact slug of second related page"],
  "containsSkills": true/false,
  "containsGoals": true/false,
  "containsDecisions": true/false
}

For relatedPageSlugs, find the EXACT slugs from existing pages that are semantically related (even if titles don't match exactly). If fewer than 2 related pages exist, use empty strings.`

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
    
    let parsed: any = {}
    try {
      parsed = JSON.parse(result.replace(/```json|```/g, '').trim())
    } catch {
      parsed = { title: note.content.slice(0, 30), keyIdeas: [note.content.slice(0, 150)], relatedPageSlugs: [], containsSkills: false, containsGoals: false, containsDecisions: false }
    }

    const title = parsed.title || note.content.slice(0, 30)
    const slug = slugify(title)
    const keyIdeas = parsed.keyIdeas || [note.content.slice(0, 150)]
    const relatedPageSlugs = (parsed.relatedPageSlugs || []).filter(Boolean)
    
    const existingPage = existingPages.find(p => p.slug === slug)
    
    let wikiPageId: number
    
    if (existingPage) {
      const newContent = existingPage.content + '\n\n## ' + new Date().toLocaleDateString() + '\n\n' + keyIdeas.join('\n- ')
      await db.wiki.update(existingPage.id!, {
        content: newContent,
        updatedAt: new Date(),
        sourceNoteIds: [...(existingPage.sourceNoteIds || []), itemId],
      })
      wikiPageId = existingPage.id!
    } else {
      const relatedYaml = relatedPageSlugs.length > 0 
        ? relatedPageSlugs.map(s => `  - ${s}`).join('\n')
        : '  []'
      
      const content = WIKI_TEMPLATE
        .replace(/{{title}}/g, title)
        .replace(/{{date}}/g, new Date().toISOString().split('T')[0])
        .replace('{{related}}', relatedYaml)
        .replace('{{content}}', `- ${keyIdeas.join('\n- ')}\n\n${note.content}\n\n**Linked Notes:**\n${relatedPageSlugs.map(s => `[[${s}]]`).join(', ')}`)

      wikiPageId = await db.wiki.add({
        slug,
        title,
        content,
        tags: [],
        related: relatedPageSlugs,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'ai',
        sourceNoteIds: [itemId],
      })
    }

    const protocolUpdates: { category: ProtocolEntry['category']; content: string }[] = []
    
    if (parsed.containsSkills) {
      protocolUpdates.push({
        category: 'skill',
        content: `Learned: ${keyIdeas[0] || note.content.slice(0, 100)} (via inbox processing)`,
      })
    }
    if (parsed.containsGoals) {
      protocolUpdates.push({
        category: 'goal',
        content: `Goal identified: ${keyIdeas[0] || note.content.slice(0, 100)} (via inbox processing)`,
      })
    }
    if (parsed.containsDecisions) {
      protocolUpdates.push({
        category: 'decision',
        content: `Decision made: ${keyIdeas[0] || note.content.slice(0, 100)} (via inbox processing)`,
      })
    }

    for (const update of protocolUpdates) {
      await db.protocol.add({
        category: update.category,
        content: update.content,
        createdAt: new Date(),
        sourceNoteId: itemId,
        aiGenerated: true,
      })
    }

    await db.notes.update(itemId, {
      status: 'archived',
      wikiLinks: relatedPageSlugs,
      relatedWikiSlug: slug,
      aiProcessedAt: new Date(),
    })

    await aiLogsStore.add({
      type: 'process-inbox',
      createdAt: new Date(),
      input: note.content.slice(0, 500),
      output: JSON.stringify({ title, keyIdeas, relatedPageSlugs, protocolEntries: protocolUpdates.length }),
      noteIdsProcessed: [itemId],
    })

    return { success: true }
  } catch (error) {
    console.error('Protocol processing error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}