import { create } from 'zustand'
import type { Settings, Habit } from '../types'

interface SettingsState extends Settings {
  setUserName: (name: string) => void
  setTheme: (theme: 'dark' | 'light') => void
  setApiKey: (key: string) => void
  setHabits: (habits: Habit[]) => void
  setOnboarded: (value: boolean) => void
  loadSettings: () => void
  clearAllData: () => void
}

const DEFAULT_SETTINGS: Settings = {
  userName: '',
  theme: 'dark',
  apiKey: '',
  habits: [],
  onboarded: false,
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,

  setUserName: (name) => {
    set({ userName: name })
    localStorage.setItem('cortex:userName', name)
  },

  setTheme: (theme) => {
    set({ theme })
    localStorage.setItem('cortex:theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  },

  setApiKey: (key) => {
    set({ apiKey: key })
    localStorage.setItem('cortex:apiKey', key)
  },

  setHabits: (habits) => {
    set({ habits })
    localStorage.setItem('cortex:habits', JSON.stringify(habits))
  },

  setOnboarded: (value) => {
    set({ onboarded: value })
    localStorage.setItem('cortex:onboarded', value ? 'true' : 'false')
  },

  loadSettings: () => {
    const userName = localStorage.getItem('cortex:userName') || ''
    const theme = (localStorage.getItem('cortex:theme') as 'dark' | 'light') || 'dark'
    const apiKey = localStorage.getItem('cortex:apiKey') || ''
    const habitsStr = localStorage.getItem('cortex:habits')
    const habits: Habit[] = habitsStr ? JSON.parse(habitsStr) : []
    const onboarded = localStorage.getItem('cortex:onboarded') === 'true'

    set({ userName, theme, apiKey, habits, onboarded })
    document.documentElement.setAttribute('data-theme', theme)
  },

  clearAllData: () => {
    localStorage.clear()
    indexedDB.deleteDatabase('CortexDB')
    set(DEFAULT_SETTINGS)
  },
}))