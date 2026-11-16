import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Shared look for text inputs and selects */
export const fieldControl =
  'h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground transition-colors placeholder:text-muted hover:border-[#c3cad5] focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring/25 disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-muted aria-invalid:border-danger aria-invalid:focus-visible:outline-danger/25 read-only:bg-surface-sunken'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(fieldControl, className)} {...props} />
}

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn('text-sm font-medium text-foreground', className)} {...props} />
}
