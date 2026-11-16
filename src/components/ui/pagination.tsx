import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Select } from './select'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: readonly number[]
}

/** How many page-number buttons to show around the current page */
const PAGE_WINDOW = 5

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(1, page), pageCount)
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, total)

  const start = Math.max(
    1,
    Math.min(current - Math.floor(PAGE_WINDOW / 2), pageCount - PAGE_WINDOW + 1),
  )
  const pages = Array.from({ length: Math.min(PAGE_WINDOW, pageCount) }, (_, i) => start + i)

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-sm"
    >
      <p className="text-muted">
        Showing <span className="text-foreground">{from}</span> to{' '}
        <span className="text-foreground">{to}</span> of{' '}
        <span className="text-foreground">{total}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <PageButton label="First page" disabled={current === 1} onClick={() => onPageChange(1)}>
          <ChevronsLeft className="size-4" />
        </PageButton>
        <PageButton
          label="Previous page"
          disabled={current === 1}
          onClick={() => onPageChange(current - 1)}
        >
          <ChevronLeft className="size-4" />
        </PageButton>
        {pages.map((p) => (
          <PageButton
            key={p}
            label={`Page ${p}`}
            active={p === current}
            onClick={() => onPageChange(p)}
          >
            {p}
          </PageButton>
        ))}
        <PageButton
          label="Next page"
          disabled={current === pageCount}
          onClick={() => onPageChange(current + 1)}
        >
          <ChevronRight className="size-4" />
        </PageButton>
        <PageButton
          label="Last page"
          disabled={current === pageCount}
          onClick={() => onPageChange(pageCount)}
        >
          <ChevronsRight className="size-4" />
        </PageButton>
      </div>

      {onPageSizeChange && (
        <div className="w-20">
          <Select
            aria-label="Rows per page"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
      )}
    </nav>
  )
}

function PageButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'grid h-8 min-w-8 place-items-center rounded-md px-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40',
        active
          ? 'bg-primary text-primary-foreground'
          : 'border border-border bg-surface text-foreground hover:bg-accent',
      )}
    >
      {children}
    </button>
  )
}
