import { create } from 'zustand'
import { db } from '../db/db'
import type { AILog } from '../types'

interface AILogsState {
  items: AILog[]
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  add: (log: Omit<AILog, 'id'>) => Promise<number>
}

export const useAILogsStore = create<AILogsState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const logs = await db.aiLogs.orderBy('createdAt').reverse().toArray()
      set({ items: logs, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  add: async (log) => {
    const id = await db.aiLogs.add(log as AILog)
    await get().fetchAll()
    return id
  },
}))