import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Statement-style register: quiet header row, hairline rules between rows, figures in
 * aligned columns. Put the unit in the header ("Amount (NPR)") and bare figures in cells.
 */
export function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-left text-sm', className)} {...props} />
    </div>
  )
}
export const THead = (p: ComponentProps<'thead'>) => (
  <thead {...p} className={cn('border-b border-border bg-surface-sunken', p.className)} />
)
export const TBody = (p: ComponentProps<'tbody'>) => (
  <tbody
    {...p}
    className={cn(
      '[&>tr]:border-b [&>tr]:border-rule [&>tr]:transition-colors [&>tr:hover]:bg-accent/60',
      p.className,
    )}
  />
)
/** Closing total row, double-ruled like the foot of a statement */
export const TFoot = (p: ComponentProps<'tfoot'>) => (
  <tfoot
    {...p}
    className={cn('border-t-2 border-foreground/80 bg-surface font-semibold', p.className)}
  />
)
export const Th = (p: ComponentProps<'th'>) => (
  <th
    {...p}
    className={cn('h-10 px-4 text-xs font-semibold whitespace-nowrap text-muted', p.className)}
  />
)
export const Td = (p: ComponentProps<'td'>) => (
  <td {...p} className={cn('h-11 px-4 whitespace-nowrap', p.className)} />
)

/** Message shown in place of table rows when there are none. */
export function TableEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="border-b border-rule">
      <EmptyState icon={icon} title={title} description={description} action={action} />
    </div>
  )
}

/** Empty, not-connected or no-results message that says what to do next. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      <span className="grid size-10 place-items-center rounded-md bg-accent text-muted [&>svg]:size-5">
        {icon}
      </span>
      <p className="mt-3 text-base font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
