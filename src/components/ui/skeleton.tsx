import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Grey placeholder shaped like the content that is loading. */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div aria-hidden className={cn('skeleton rounded-sm bg-[#e4e8ee]', className)} {...props} />
  )
}

/** Placeholder rows for a table while its data loads. */
export function SkeletonRows({ rows = 6, columns }: { rows?: number; columns: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} className="border-b border-rule">
          {Array.from({ length: columns }, (_, c) => (
            <td key={c} className="h-11 px-4">
              <Skeleton className={cn('h-3', c === 0 ? 'w-32' : 'w-20')} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
