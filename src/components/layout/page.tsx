import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface BandFigure {
  label: string
  value: ReactNode
  /** Small line under the value, e.g. "+6.2% vs Oct" */
  note?: ReactNode
}

interface PageProps {
  title: string
  /** Line under the title: the period, scope or a count */
  description?: ReactNode
  /** Headline totals shown across the band, like the top of a statement */
  figures?: BandFigure[]
  /** Control on the band's right edge, e.g. a period switch */
  bandAside?: ReactNode
  /** Page actions (Add, Export) on the toolbar above the content */
  actions?: ReactNode
  /** Filters or search on the left of the toolbar */
  toolbar?: ReactNode
  children?: ReactNode
  className?: string
  /** Set false when the content brings its own panels */
  panel?: boolean
  /** Content runs edge to edge in the panel (tables); otherwise it gets padding */
  flush?: boolean
}

/**
 * Every page opens with the statement band (title, period, headline totals),
 * followed by the white register panel that holds the page's content.
 */
export function Page({
  title,
  description,
  figures,
  bandAside,
  actions,
  toolbar,
  children,
  className,
  panel = true,
  flush = false,
}: PageProps) {
  const hasToolbar = Boolean(actions || toolbar)
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <section
        aria-labelledby="page-title"
        className="rounded-lg border border-primary-soft-border bg-primary-soft px-5 py-4 sm:px-6 sm:py-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 id="page-title" className="text-2xl font-semibold">
              {title}
            </h1>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {bandAside}
        </div>
        {figures && figures.length > 0 && (
          <dl className="mt-4 grid grid-cols-2 gap-y-4 border-t border-primary-soft-border pt-4 lg:grid-cols-4">
            {figures.map((f) => (
              <div
                key={f.label}
                className="border-primary-soft-border pr-4 lg:border-l lg:pl-4 lg:first:border-l-0 lg:first:pl-0"
              >
                <dt className="text-xs text-muted">{f.label}</dt>
                <dd className="mt-0.5 text-xl font-semibold">{f.value}</dd>
                {f.note && <dd className="text-xs text-muted">{f.note}</dd>}
              </div>
            ))}
          </dl>
        )}
      </section>

      {(hasToolbar || children) &&
        (panel ? (
          <section className="overflow-hidden rounded-lg border border-border bg-surface">
            {hasToolbar && (
              <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
                <div className="flex min-w-0 flex-1 basis-full flex-wrap items-center gap-2 sm:basis-auto">
                  {toolbar}
                </div>
                {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
              </div>
            )}
            {children && <div className={cn(!flush && 'p-4 sm:p-5')}>{children}</div>}
          </section>
        ) : (
          <>
            {hasToolbar && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{toolbar}</div>
                {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
              </div>
            )}
            {children}
          </>
        ))}
    </div>
  )
}
