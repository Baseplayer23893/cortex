import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors ${className}`}
          {...props}
        />
        {error && (
          <p className="text-sm text-[var(--red)]">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input