import { create } from 'zustand'
import { db } from '../db/db'
import type { TimetableBlock } from '../types'

interface TimetableState {
  items: TimetableBlock[]
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  add: (block: Omit<TimetableBlock, 'id'>) => Promise<number>
  update: (id: number, updates: Partial<TimetableBlock>) => Promise<void>
  delete: (id: number) => Promise<void>
  getBlocksForDay: (day: number) => TimetableBlock[]
  getTodayBlocks: () => TimetableBlock[]
}

export const useTimetableStore = create<TimetableState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const blocks = await db.timetable.orderBy('startTime').toArray()
      set({ items: blocks, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  add: async (block) => {
    const id = await db.timetable.add(block as TimetableBlock)
    await get().fetchAll()
    return id
  },

  update: async (id, updates) => {
    await db.timetable.update(id, updates)
    await get().fetchAll()
  },

  delete: async (id) => {
    await db.timetable.delete(id)
    await get().fetchAll()
  },

  getBlocksForDay: (day) => {
    return get().items
      .filter(b => b.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  },

  getTodayBlocks: () => {
    const today = new Date().getDay()
    return get().getBlocksForDay(today)
  },
}))