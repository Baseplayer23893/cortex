import { create } from 'zustand'
import { db } from '../db/db'
import type { JournalEntry } from '../types'
import { getTodayDateString } from '../lib/utils'

interface JournalState {
  items: JournalEntry[]
  currentEntry: JournalEntry | null
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  getOrCreateEntry: (date: string) => Promise<JournalEntry>
  updateEntry: (id: number, content: string, wordCount: number) => Promise<void>
  delete: (id: number) => Promise<void>
}

export const useJournalStore = create<JournalState>((set, get) => ({
  items: [],
  currentEntry: null,
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const entries = await db.journal.orderBy('date').reverse().toArray()
      set({ items: entries, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  getOrCreateEntry: async (date: string) => {
    const existing = await db.journal.where('date').equals(date).first()
    if (existing) {
      set({ currentEntry: existing })
      return existing
    }

    const now = new Date()
    const newEntry: JournalEntry = {
      date,
      content: '',
      wordCount: 0,
      createdAt: now,
      updatedAt: now,
    }

    const id = await db.journal.add(newEntry)
    const entry = { ...newEntry, id }
    set({ currentEntry: entry })
    await get().fetchAll()
    return entry
  },

  updateEntry: async (id, content, wordCount) => {
    await db.journal.update(id, {
      content,
      wordCount,
      updatedAt: new Date(),
    })
    const updated = await db.journal.get(id)
    if (updated) {
      set({ currentEntry: updated })
    }
    await get().fetchAll()
  },

  delete: async (id) => {
    await db.journal.delete(id)
    set({ currentEntry: null })
    await get().fetchAll()
  },
}))