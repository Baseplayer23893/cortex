import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../store'
import Input from './ui/Input'
import Button from './ui/Button'
import { Brain, ArrowRight, Check, Cloud, HardDrive } from 'lucide-react'

export default function Onboarding() {
  const navigate = useNavigate()
  const { 
    setUserName, 
    setApiKey, 
    setApiBaseUrl, 
    setAiModel,
    setOnboarded, 
    signInGoogle, 
    initializeAuth 
  } = useSettingsStore()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [apiBaseUrl, setApiBaseUrlState] = useState('https://api.minimax.chat/v1')
  const [aiModel, setAiModelState] = useState('MiniMax-Text-01')
  const [apiKey, setApiKeyState] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleNameSubmit = () => {
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    setUserName(name.trim())
    setStep(2)
    setError('')
  }

  const handleApiSubmit = () => {
    setApiBaseUrl(apiBaseUrl)
    setAiModel(aiModel)
    setApiKey(apiKey)
    setStep(3)
    setError('')
  }

  const handleSkipApi = () => {
    setStep(3)
  }

  const handleSyncWithGoogle = async () => {
    setLoading(true)
    initializeAuth()
    const { error } = await signInGoogle()
    if (error) {
      setError('Failed to sign in with Google')
      setLoading(false)
      return
    }
  }

  const handleUseLocally = () => {
    setOnboarded(true)
    navigate('/daily')
  }

  return (
    <div className="fixed inset-0 bg-[var(--bg-base)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--accent-soft)] rounded-2xl mb-4">
            <Brain className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Welcome to Cortex
          </h1>
          <p className="text-[var(--text-secondary)]">
            Your personal second brain
          </p>
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <Input
                label="What's your name?"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                autoFocus
              />
              {error && <p className="text-sm text-[var(--red)]">{error}</p>}
              <Button onClick={handleNameSubmit} className="w-full">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg">
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  Connect any OpenAI-compatible AI provider (OpenRouter, Groq, MiniMax, local models, etc.)
                </p>
              </div>
              
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">API Base URL</label>
                <Input
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrlState(e.target.value)}
                  placeholder="https://api.minimax.chat/v1"
                />
              </div>
              
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Model Name</label>
                <Input
                  value={aiModel}
                  onChange={(e) => setAiModelState(e.target.value)}
                  placeholder="MiniMax-Text-01"
                />
              </div>
              
              <Input
                label="API Key (optional)"
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKeyState(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApiSubmit()}
              />
              {error && <p className="text-sm text-[var(--red)]">{error}</p>}
              
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleSkipApi} className="flex-1">
                  Skip
                </Button>
                <Button onClick={handleApiSubmit} className="flex-1">
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-medium text-[var(--text-primary)]">
                  Sync across devices?
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Sign in to access your data on any device
                </p>
              </div>

              <Button 
                onClick={handleSyncWithGoogle} 
                className="w-full"
                disabled={loading}
              >
                <Cloud className="w-4 h-4 mr-2" />
                {loading ? 'Signing in...' : 'Sign in with Google'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border)]" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[var(--bg-base)] text-[var(--text-tertiary)]">or</span>
                </div>
              </div>

              <Button 
                variant="secondary" 
                onClick={handleUseLocally} 
                className="w-full"
              >
                <HardDrive className="w-4 h-4 mr-2" />
                Use locally only
              </Button>

              <p className="text-xs text-[var(--text-tertiary)] text-center">
                You can always sign in later in Settings
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}