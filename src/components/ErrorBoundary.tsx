import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] text-[#a1a1aa] font-mono p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#151518] border border-[#ef4444]/30 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1f] border-b border-[#27272a]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                </div>
                <span className="ml-2 text-xs text-[#71717a]">cortex — fatal error</span>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4 text-[#ef4444]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-lg font-semibold">&gt; FATAL SYSTEM ERROR</span>
                </div>
                
                <div className="bg-[#0a0a0f] border border-[#27272a] rounded p-4 mb-4">
                  <p className="text-sm text-[#ef4444] break-words">
                    {this.state.error?.message || 'Unknown error occurred'}
                  </p>
                </div>
                
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-[#7c3aed] text-white rounded hover:bg-[#6d28d9] transition-colors text-sm"
                >
                  Reload Cortex
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}