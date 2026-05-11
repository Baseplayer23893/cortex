import { useState, useEffect } from 'react'
import { useSettingsStore } from '../store'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { Trash2, Plus, Eye, EyeOff, Moon, Sun, User, Key, Check, Cloud, LogOut, RefreshCw } from 'lucide-react'
import type { Habit } from '../types'

export default function Settings() {
  const {
    userName,
    theme,
    apiKey,
    apiBaseUrl,
    aiModel,
    habits,
    isLoggedIn,
    syncStatus,
    setUserName,
    setTheme,
    setApiKey,
    setApiBaseUrl,
    setAiModel,
    setHabits,
    loadSettings,
    clearAllData,
    signInGoogle,
    signOut,
    initializeAuth,
  } = useSettingsStore()

  const [localName, setLocalName] = useState(userName)
  const [localApiKey, setLocalApiKey] = useState(apiKey)
  const [localApiBaseUrl, setLocalApiBaseUrl] = useState(apiBaseUrl)
  const [localAiModel, setLocalAiModel] = useState(aiModel)
  const [showApiKey, setShowApiKey] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [saved, setSaved] = useState(false)
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    loadSettings()
    initializeAuth()
  }, [])

  useEffect(() => {
    setLocalName(userName)
    setLocalApiKey(apiKey)
    setLocalApiBaseUrl(apiBaseUrl)
    setLocalAiModel(aiModel)
  }, [userName, apiKey, apiBaseUrl, aiModel])

  const handleSaveName = () => {
    setUserName(localName)
    showSaved()
  }

  const handleSaveApiSettings = () => {
    setApiKey(localApiKey)
    setApiBaseUrl(localApiBaseUrl)
    setAiModel(localAiModel)
    showSaved()
  }

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      icon: '✨',
    }
    setHabits([...habits, newHabit])
    setNewHabitName('')
  }

  const handleRemoveHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id))
  }

  const handleClearData = () => {
    clearAllData()
  }

  const handleSignIn = async () => {
    setSigningIn(true)
    await signInGoogle()
    setSigningIn(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const getSyncStatusDisplay = () => {
    switch (syncStatus) {
      case 'synced':
        return { icon: <Check className="w-4 h-4" />, text: 'Synced', color: 'text-[var(--green)]' }
      case 'syncing':
        return { icon: <RefreshCw className="w-4 h-4 animate-spin" />, text: 'Syncing...', color: 'text-[var(--accent)]' }
      case 'offline':
        return { icon: <Cloud className="w-4 h-4" />, text: 'Offline', color: 'text-[var(--amber)]' }
      default:
        return { icon: <Cloud className="w-4 h-4" />, text: 'Local only', color: 'text-[var(--text-tertiary)]' }
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        {saved && (
          <span className="flex items-center text-sm text-[var(--green)]">
            <Check className="w-4 h-4 mr-1" />
            Saved
          </span>
        )}
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-[var(--text-secondary)]" />
          <h2 className="text-lg font-medium">Profile</h2>
        </div>
        <div className="flex gap-3">
          <Input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder="Your name"
            className="flex-1"
          />
          <Button onClick={handleSaveName}>Save</Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Cloud className="w-5 h-5 text-[var(--text-secondary)]" />
          <h2 className="text-lg font-medium">Sync</h2>
          {isLoggedIn && (
            <span className={`ml-auto flex items-center gap-1.5 text-sm ${getSyncStatusDisplay().color}`}>
              {getSyncStatusDisplay().icon}
              {getSyncStatusDisplay().text}
            </span>
          )}
        </div>
        
        {!isLoggedIn ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              Sign in to sync your data across devices and access it anywhere.
            </p>
            <Button onClick={handleSignIn} disabled={signingIn}>
              <Cloud className="w-4 h-4 mr-2" />
              {signingIn ? 'Signing in...' : 'Sign in with Google'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              You are signed in. Your data is automatically synced to the cloud.
            </p>
            <Button variant="secondary" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-[var(--text-secondary)]" />
          <h2 className="text-lg font-medium">AI Configuration</h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Connect any OpenAI-compatible API (OpenRouter, Groq, local models, etc.)
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">API Base URL</label>
            <Input
              value={localApiBaseUrl}
              onChange={(e) => setLocalApiBaseUrl(e.target.value)}
              placeholder="https://api.minimax.chat/v1"
            />
          </div>
          
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Model Name</label>
            <Input
              value={localAiModel}
              onChange={(e) => setLocalAiModel(e.target.value)}
              placeholder="MiniMax-Text-01"
            />
          </div>
          
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">API Key</label>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <Button onClick={handleSaveApiSettings}>Save AI Settings</Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          {theme === 'dark' ? (
            <Moon className="w-5 h-5 text-[var(--text-secondary)]" />
          ) : (
            <Sun className="w-5 h-5 text-[var(--text-secondary)]" />
          )}
          <h2 className="text-lg font-medium">Theme</h2>
        </div>
        <Button
          variant={theme === 'dark' ? 'primary' : 'secondary'}
          onClick={handleToggleTheme}
        >
          {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </Button>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-medium">Habits</h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Track daily habits in your Daily Note
        </p>
        
        {habits.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {habits.map((habit) => (
              <span
                key={habit.id}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--bg-elevated)] rounded-full text-sm"
              >
                <span>{habit.icon}</span>
                <span>{habit.name}</span>
                <button
                  onClick={() => handleRemoveHabit(habit.id)}
                  className="ml-1 text-[var(--text-tertiary)] hover:text-[var(--red)]"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <Input
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="New habit name"
            onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
            className="flex-1"
          />
          <Button variant="secondary" onClick={handleAddHabit}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-5 h-5 text-[var(--red)]" />
          <h2 className="text-lg font-medium">Danger Zone</h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          This will permanently delete all your data including notes, journal entries, wiki pages, tasks, and settings.
        </p>
        
        {!showClearConfirm ? (
          <Button variant="danger" onClick={() => setShowClearConfirm(true)}>
            Clear All Data
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClearData}>
              Yes, Delete Everything
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}