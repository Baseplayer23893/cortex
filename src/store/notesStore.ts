import { create } from 'zustand'
import { db } from '../db/db'
import { supabase } from '../lib/supabase'
import type { Note } from '../types'

interface NotesState {
  items: Note[]
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  syncFromSupabase: () => Promise<void>
  add: (note: Omit<Note, 'id'>) => Promise<number>
  update: (id: number, updates: Partial<Note>) => Promise<void>
  delete: (id: number) => Promise<void>
  getInboxCount: () => number
}

async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

async function syncNoteToRemote(note: Note, localId: number): Promise<string | null> {
  const userId = await getUserId()
  if (!userId) return null

  try {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        content: note.content,
        created_at: note.createdAt.toISOString(),
        status: note.status,
        tags: note.tags || [],
        source: note.source,
        user_id: userId,
        local_id: localId,
      })
      .select('id')
      .single()

    if (error) throw error
    return data?.id || null
  } catch (e) {
    console.error('Remote sync error:', e)
    return null
  }
}

async function updateRemoteNote(id: number, updates: Partial<Note>): Promise<void> {
  const userId = await getUserId()
  if (!userId) return

  try {
    await supabase
      .from('notes')
      .update({
        content: updates.content,
        status: updates.status,
        tags: updates.tags,
      })
      .eq('local_id', id)
      .eq('user_id', userId)
  } catch (e) {
    console.error('Remote update error:', e)
  }
}

async function deleteRemoteNote(localId: number): Promise<void> {
  const userId = await getUserId()
  if (!userId) return

  try {
    await supabase
      .from('notes')
      .delete()
      .eq('local_id', localId)
      .eq('user_id', userId)
  } catch (e) {
    console.error('Remote delete error:', e)
  }
}

async function fetchRemoteNotes(): Promise<any[]> {
  const userId = await getUserId()
  if (!userId) return []

  try {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return data || []
  } catch (e) {
    console.error('Fetch remote error:', e)
    return []
  }
}

export const useNotesStore = create<NotesState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const localNotes = await db.notes.orderBy('createdAt').reverse().toArray()
      const remoteNotes = await fetchRemoteNotes()

      if (remoteNotes.length > 0) {
        const localIds = new Set(localNotes.map(n => n.id))
        const newFromRemote = remoteNotes.filter((rn: any) => !localIds.has(rn.local_id))

        for (const remoteNote of newFromRemote) {
          await db.notes.add({
            content: remoteNote.content,
            createdAt: new Date(remoteNote.created_at),
            status: remoteNote.status || 'inbox',
            tags: remoteNote.tags || [],
            source: remoteNote.source,
          })
        }
      }

      const updatedNotes = await db.notes.orderBy('createdAt').reverse().toArray()
      set({ items: updatedNotes, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  syncFromSupabase: async () => {
    const userId = await getUserId()
    if (!userId) return

    try {
      const remoteNotes = await fetchRemoteNotes()
      if (remoteNotes.length === 0) return

      const localNotes = await db.notes.toArray()
      const localContentSet = new Set(localNotes.map(n => n.content.slice(0, 50)))

      for (const remoteNote of remoteNotes as any[]) {
        if (!localContentSet.has(remoteNote.content.slice(0, 50))) {
          await db.notes.add({
            content: remoteNote.content,
            createdAt: new Date(remoteNote.created_at),
            status: remoteNote.status || 'inbox',
            tags: remoteNote.tags || [],
            source: remoteNote.source,
          })
        }
      }

      await get().fetchAll()
    } catch (e) {
      console.error('Sync error:', e)
    }
  },

  add: async (note) => {
    const localId = await db.notes.add(note as Note)
    await syncNoteToRemote(note, localId)
    await get().fetchAll()
    return localId
  },

  update: async (id, updates) => {
    await db.notes.update(id, updates)
    await updateRemoteNote(id, updates)
    await get().fetchAll()
  },

  delete: async (id) => {
    await db.notes.delete(id)
    await deleteRemoteNote(id)
    await get().fetchAll()
  },

  getInboxCount: () => {
    return get().items.filter(n => n.status === 'inbox').length
  },
}))