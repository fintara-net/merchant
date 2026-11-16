import type { ReactNode } from 'react'

/**
 * Cancel / Save row at the end of a form in a side panel. It stays pinned to the bottom of
 * the panel while the fields scroll, so the save button is always in reach.
 */
export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-6 mt-2 -mb-5 flex flex-col-reverse gap-2 border-t border-border bg-surface px-6 py-3 sm:flex-row sm:justify-end">
      {children}
    </div>
  )
}
