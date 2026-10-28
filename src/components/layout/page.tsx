import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageProps {
  title: string
  /** Small text under the title, e.g. a count */
  description?: ReactNode
  /** Right side of the title row, e.g. an export button */
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

/** White panel that holds a page: title row on top, content below. */
export function Page({ title, description, actions, children, className }: PageProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border bg-surface p-5 shadow-sm shadow-brand-600/5 sm:p-6',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </section>
  )
}
