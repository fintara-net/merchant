import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Styled native <select>: keyboard- and mobile-friendly with no extra dependencies. */
export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select
        className={cn(
          'h-10 w-full cursor-pointer appearance-none rounded-lg border bg-surface pr-9 pl-3 text-sm transition-colors hover:border-primary/40 focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-primary/30',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
    </div>
  )
}
