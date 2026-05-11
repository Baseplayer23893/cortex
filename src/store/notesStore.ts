import { create } from 'zustand'
import { db } from '../db/db'
import type { Note } from '../types'

interface NotesState {
  items: Note[]
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  add: (note: Omit<Note, 'id'>) => Promise<number>
  update: (id: number, updates: Partial<Note>) => Promise<void>
  delete: (id: number) => Promise<void>
  getInboxCount: () => number
}

export const useNotesStore = create<NotesState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const notes = await db.notes.orderBy('createdAt').reverse().toArray()
      set({ items: notes, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  add: async (note) => {
    const id = await db.notes.add(note as Note)
    await get().fetchAll()
    return id
  },

  update: async (id, updates) => {
    await db.notes.update(id, updates)
    await get().fetchAll()
  },

  delete: async (id) => {
    await db.notes.delete(id)
    await get().fetchAll()
  },

  getInboxCount: () => {
    return get().items.filter(n => n.status === 'inbox').length
  },
}))