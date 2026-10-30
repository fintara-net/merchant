import type { ReactNode } from 'react'
import type { FieldError } from 'react-hook-form'
import { Label } from './input'

interface FieldProps {
  id: string
  label: string
  /** Shows a small "Optional" tag on the same line, so labels don't wrap */
  optional?: boolean
  error?: FieldError
  /** Shown under the input when there's no error */
  hint?: string
  children: ReactNode
}

/** Label + input + error message, used by every form */
export function Field({ id, label, optional = false, error, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {optional && <span className="text-xs text-muted">Optional</span>}
      </div>
      {children}
      {error ? (
        <p className="text-xs text-danger">{error.message}</p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  )
}
