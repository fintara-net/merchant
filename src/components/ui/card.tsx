import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** White panel with a hairline border. Panels never nest inside each other. */
export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('overflow-hidden rounded-lg border border-border bg-surface', className)}
      {...props}
    />
  )
}

/** Panel title row, ruled off like a statement's section heading. */
export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex min-h-12 flex-wrap items-center gap-3 border-b border-border px-4 py-2.5',
        className,
      )}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: ComponentProps<'h2'>) {
  return <h2 className={cn('text-base font-semibold', className)} {...props} />
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('p-4', className)} {...props} />
}
