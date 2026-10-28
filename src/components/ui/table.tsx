import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Clean table: tinted header band, thin row separators, hover highlight. */
export function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-left text-sm', className)} {...props} />
    </div>
  )
}
export const THead = (p: ComponentProps<'thead'>) => (
  <thead {...p} className={cn('bg-accent text-foreground', p.className)} />
)
export const TBody = (p: ComponentProps<'tbody'>) => (
  <tbody
    {...p}
    className={cn(
      'text-foreground/80 [&>tr]:border-b [&>tr]:transition-colors [&>tr:hover]:bg-accent/40',
      p.className,
    )}
  />
)
export const Th = (p: ComponentProps<'th'>) => (
  <th {...p} className={cn('px-4 py-3.5 font-semibold whitespace-nowrap', p.className)} />
)
export const Td = (p: ComponentProps<'td'>) => (
  <td {...p} className={cn('px-4 py-3.5 whitespace-nowrap', p.className)} />
)
