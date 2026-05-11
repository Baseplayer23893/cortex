import { create } from 'zustand'
import { db } from '../db/db'
import type { ProtocolEntry } from '../types'

interface ProtocolState {
  items: ProtocolEntry[]
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  add: (entry: Omit<ProtocolEntry, 'id'>) => Promise<number>
  update: (id: number, updates: Partial<ProtocolEntry>) => Promise<void>
  delete: (id: number) => Promise<void>
  getByCategory: (category: ProtocolEntry['category']) => ProtocolEntry[]
}

export const useProtocolStore = create<ProtocolState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const entries = await db.protocol.orderBy('createdAt').reverse().toArray()
      set({ items: entries, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  add: async (entry) => {
    const id = await db.protocol.add(entry as ProtocolEntry)
    await get().fetchAll()
    return id
  },

  update: async (id, updates) => {
    await db.protocol.update(id, updates)
    await get().fetchAll()
  },

  delete: async (id) => {
    await db.protocol.delete(id)
    await get().fetchAll()
  },

  getByCategory: (category) => {
    return get().items.filter(e => e.category === category)
  },
}))