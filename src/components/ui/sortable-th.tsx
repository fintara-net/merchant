import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Th } from './table'

export interface SortState<K extends string> {
  key: K
  direction: 'asc' | 'desc'
}

/**
 * Client-side sorting for lists that are fully loaded (banks, merchants).
 * Clicking a column sorts ascending, then descending.
 */
export function useSort<T, K extends string>(
  rows: T[],
  initial: SortState<K>,
  value: (row: T, key: K) => string | number,
) {
  const [sort, setSort] = useState(initial)
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
  const sorted = rows.toSorted((a, b) => {
    const x = value(a, sort.key)
    const y = value(b, sort.key)
    const result =
      typeof x === 'number' && typeof y === 'number'
        ? x - y
        : collator.compare(String(x), String(y))
    return sort.direction === 'asc' ? result : -result
  })
  const toggle = (key: K) =>
    setSort((s) => ({ key, direction: s.key === key && s.direction === 'asc' ? 'desc' : 'asc' }))
  return { sorted, sort, toggle }
}

/** Column header that sorts its column; announces the order to screen readers. */
export function SortableTh<K extends string>({
  column,
  sort,
  onSort,
  children,
  className,
}: {
  column: K
  sort: SortState<K>
  onSort: (key: K) => void
  children: string
  className?: string
}) {
  const active = sort.key === column
  const Icon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown
  return (
    <Th
      className={className}
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          '-mx-1 inline-flex items-center gap-1 rounded-sm px-1 py-0.5 hover:text-foreground',
          active && 'text-foreground',
        )}
      >
        {children}
        <Icon aria-hidden className={cn('size-3', !active && 'opacity-50')} />
      </button>
    </Th>
  )
}
