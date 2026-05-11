import { create } from 'zustand'
import { db } from '../db/db'
import { supabase } from '../lib/supabase'
import type { TimetableBlock } from '../types'

interface TimetableState {
  items: TimetableBlock[]
  loading: boolean
  error: string | null
  googleEvents: TimetableBlock[]
  fetchAll: () => Promise<void>
  add: (block: Omit<TimetableBlock, 'id'>) => Promise<number>
  update: (id: number, updates: Partial<TimetableBlock>) => Promise<void>
  delete: (id: number) => Promise<void>
  getBlocksForDay: (day: number) => TimetableBlock[]
  getTodayBlocks: () => TimetableBlock[]
  fetchGoogleEvents: () => Promise<{ success: boolean; message: string }>
}

export const useTimetableStore = create<TimetableState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  googleEvents: [],

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

  fetchGoogleEvents: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.provider_token) {
        return { success: false, message: 'Not signed in with Google. Please sign in to sync calendar.' }
      }

      const now = new Date()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Monday
      startOfWeek.setHours(0, 0, 0, 0)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 14) // Next 2 weeks

      const timeMin = startOfWeek.toISOString()
      const timeMax = endOfWeek.toISOString()

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${session.provider_token}`,
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        return { success: false, message: error.error?.message || 'Failed to fetch Google Calendar events' }
      }

      const data = await response.json()
      
      if (!data.items || data.items.length === 0) {
        set({ googleEvents: [] })
        return { success: true, message: 'No events found in your Google Calendar' }
      }

      const events: TimetableBlock[] = data.items
        .filter((event: any) => event.start?.dateTime) // Filter out all-day events
        .map((event: any) => {
          const start = new Date(event.start.dateTime)
          const end = new Date(event.end.dateTime)
          const dayOfWeek = start.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
          const startTime = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
          const endTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`
          
          return {
            title: event.summary || 'Google Event',
            dayOfWeek,
            startTime,
            endTime,
            color: '#4285F4',
            location: event.location || undefined,
            recurring: false,
            notes: `Google Calendar: ${event.summary}`,
          } as TimetableBlock
        })

      set({ googleEvents: events })
      return { success: true, message: `Synced ${events.length} events from Google Calendar` }
    } catch (error) {
      console.error('Error fetching Google events:', error)
      return { success: false, message: 'Failed to fetch Google Calendar events' }
    }
  },
}))