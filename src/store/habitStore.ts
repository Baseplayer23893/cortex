import { create } from 'zustand'
import { db } from '../db/db'
import type { HabitLog, Habit } from '../types'

interface HabitState {
  logs: HabitLog[]
  habits: Habit[]
  loading: boolean
  error: string | null
  fetchLogs: () => Promise<void>
  setHabits: (habits: Habit[]) => void
  toggleHabit: (habitId: string, date: string) => Promise<void>
  getLogsForDate: (date: string) => HabitLog[]
}

export const useHabitStore = create<HabitState>((set, get) => ({
  logs: [],
  habits: [],
  loading: false,
  error: null,

  fetchLogs: async () => {
    set({ loading: true, error: null })
    try {
      const logs = await db.habitLogs.orderBy('date').reverse().toArray()
      set({ logs, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  setHabits: (habits) => {
    set({ habits })
    localStorage.setItem('cortex:habits', JSON.stringify(habits))
  },

  toggleHabit: async (habitId, date) => {
    const existing = await db.habitLogs
      .where(['habitId', 'date'])
      .equals([habitId, date])
      .first()

    if (existing) {
      await db.habitLogs.delete(existing.id!)
    } else {
      await db.habitLogs.add({
        habitId,
        date,
        completed: true,
      })
    }
    await get().fetchLogs()
  },

  getLogsForDate: (date) => {
    return get().logs.filter(l => l.date === date)
  },
}))