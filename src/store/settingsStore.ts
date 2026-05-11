import { create } from 'zustand'
import type { Settings, Habit } from '../types'
import { getUser, onAuthStateChange, signInWithGoogle, signOut as signOutAuth } from '../lib/auth'
import { pullFromSupabase, checkSyncStatus, type SyncStatus } from '../lib/sync'
import { db } from '../db/db'

interface SettingsState extends Settings {
  userId: string | null
  isLoggedIn: boolean
  syncEnabled: boolean
  syncStatus: SyncStatus
  setUserName: (name: string) => void
  setTheme: (theme: 'dark' | 'light') => void
  setApiKey: (key: string) => void
  setApiBaseUrl: (url: string) => void
  setAiModel: (model: string) => void
  setHabits: (habits: Habit[]) => void
  setOnboarded: (value: boolean) => void
  setSyncStatus: (status: SyncStatus) => void
  loadSettings: () => Promise<void>
  clearAllData: () => void
  signInGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  initializeAuth: () => void
}

const DEFAULT_SETTINGS: Settings = {
  userName: '',
  theme: 'dark',
  apiKey: '',
  apiBaseUrl: 'https://api.minimax.chat/v1',
  aiModel: 'MiniMax-Text-01',
  habits: [],
  onboarded: false,
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  userId: null,
  isLoggedIn: false,
  syncEnabled: false,
  syncStatus: 'local-only',

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

  setApiBaseUrl: (url) => {
    set({ apiBaseUrl: url })
    localStorage.setItem('cortex:apiBaseUrl', url)
  },

  setAiModel: (model) => {
    set({ aiModel: model })
    localStorage.setItem('cortex:aiModel', model)
  },

  setHabits: (habits) => {
    set({ habits })
    localStorage.setItem('cortex:habits', JSON.stringify(habits))
  },

  setOnboarded: (value) => {
    set({ onboarded: value })
    localStorage.setItem('cortex:onboarded', value ? 'true' : 'false')
  },

  setSyncStatus: (status) => {
    set({ syncStatus: status })
  },

  loadSettings: async () => {
    const userName = localStorage.getItem('cortex:userName') || ''
    const theme = (localStorage.getItem('cortex:theme') as 'dark' | 'light') || 'dark'
    const apiKey = localStorage.getItem('cortex:apiKey') || ''
    const apiBaseUrl = localStorage.getItem('cortex:apiBaseUrl') || 'https://api.minimax.chat/v1'
    const aiModel = localStorage.getItem('cortex:aiModel') || 'MiniMax-Text-01'
    const habitsStr = localStorage.getItem('cortex:habits')
    const habits: Habit[] = habitsStr ? JSON.parse(habitsStr) : []
    let onboarded = localStorage.getItem('cortex:onboarded') === 'true'

    set({ userName, theme, apiKey, apiBaseUrl, aiModel, habits, onboarded })
    document.documentElement.setAttribute('data-theme', theme)

    const user = await getUser()
    if (user) {
      // If user is logged in, they're onboarded regardless of localStorage flag
      onboarded = true
      set({ 
        userId: user.id, 
        isLoggedIn: true, 
        syncEnabled: true,
        onboarded: true,
        userName: user.user_metadata.full_name || userName,
      })
      localStorage.setItem('cortex:onboarded', 'true')
      
      const status = await checkSyncStatus()
      set({ syncStatus: status })
      
      const { error } = await pullFromSupabase()
      if (!error) {
        console.log('Data synced from Supabase')
      }
    }
  },

  clearAllData: async () => {
    const { isLoggedIn } = get()
    if (isLoggedIn) {
      await signOutAuth()
    }
    localStorage.clear()
    await db.delete()
    set({ ...DEFAULT_SETTINGS, userId: null, isLoggedIn: false, syncEnabled: false, syncStatus: 'local-only' })
  },

  signInGoogle: async () => {
    const { error } = await signInWithGoogle()
    if (!error) {
      set({ syncEnabled: true, syncStatus: 'syncing' })
    }
    return { error }
  },

  signOut: async () => {
    await signOutAuth()
    set({ userId: null, isLoggedIn: false, syncEnabled: false, syncStatus: 'local-only' })
    await db.delete()
    window.location.reload()
  },

  initializeAuth: () => {
    onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        set({ 
          userId: session.user.id, 
          isLoggedIn: true, 
          syncEnabled: true,
          syncStatus: 'syncing',
          onboarded: true,
        })
        localStorage.setItem('cortex:onboarded', 'true')
        
        const { error } = await pullFromSupabase()
        if (!error) {
          set({ syncStatus: 'synced' })
        } else {
          set({ syncStatus: 'local-only' })
        }
      } else if (event === 'SIGNED_OUT') {
        set({ userId: null, isLoggedIn: false, syncEnabled: false, syncStatus: 'local-only', onboarded: false })
        localStorage.setItem('cortex:onboarded', 'false')
      }
    })
  },
}))