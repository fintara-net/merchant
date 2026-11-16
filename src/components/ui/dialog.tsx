import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  children?: ReactNode
  className?: string
  /**
   * dialog: small centred box for confirmations and one-off messages.
   * sheet: full-height panel from the right for forms and details, so the list stays in view.
   */
  variant?: 'dialog' | 'sheet'
  /** Sticky action row at the bottom of a sheet (e.g. Cancel / Save) */
  footer?: ReactNode
}

/**
 * Built on the native <dialog> element, which gives focus trapping, Escape-to-close and an
 * accessible modal role for free. It renders in the top layer, so tables never clip it.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  variant = 'dialog',
  footer,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const sheet = variant === 'sheet'

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      data-variant={variant}
      aria-labelledby={titleId}
      onClose={onClose}
      // Clicking the dimmed backdrop (the dialog element itself) closes it
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        'bg-surface text-foreground backdrop:bg-[rgb(20_25_42/0.45)]',
        sheet
          ? 'fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-lg border-l border-border shadow-[-12px_0_32px_rgb(20_25_42/0.12)]'
          : 'm-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border shadow-[0_16px_40px_rgb(20_25_42/0.18)]',
        className,
      )}
    >
      {open && (
        <div className={cn(sheet && 'flex h-full flex-col')}>
          <div
            className={cn(
              'flex items-start justify-between gap-4',
              sheet ? 'border-b-2 border-navy px-6 py-4' : 'px-6 pt-5 pb-4',
            )}
          >
            <div>
              <h2 id={titleId} className="text-xl font-semibold">
                {title}
              </h2>
              {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 grid size-8 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          {children && (
            <div className={cn(sheet ? 'flex-1 overflow-y-auto px-6 py-5' : 'px-6 pb-5')}>
              {children}
            </div>
          )}
          {footer && (
            <div
              className={cn(
                'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
                sheet ? 'border-t border-border px-6 py-3' : 'px-6 pb-5',
              )}
            >
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  )
}
