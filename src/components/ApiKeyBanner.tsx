import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import Button from './ui/Button'

interface ApiKeyBannerProps {
  message?: string
}

export default function ApiKeyBanner({ 
  message = 'Add your MiniMax API key in Settings to use AI features.' 
}: ApiKeyBannerProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[var(--amber)]/10 border border-[var(--amber)]/30 rounded-lg">
      <AlertTriangle className="w-5 h-5 text-[var(--amber)] flex-shrink-0" />
      <p className="text-sm text-[var(--amber)] flex-1">{message}</p>
      <Link to="/settings">
        <Button size="sm" variant="secondary">
          Add Key
        </Button>
      </Link>
    </div>
  )
}