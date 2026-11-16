import { MoreHorizontal, type LucideIcon } from 'lucide-react'
import { useId, useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

export interface RowMenuItem {
  label: string
  icon: LucideIcon
  onSelect: () => void
  /** Red text for actions that take something away (lock, deactivate, reset) */
  tone?: 'danger'
  /** Draws a divider above this item */
  separated?: boolean
}

const MENU_WIDTH = 224

/**
 * The "⋯" actions menu at the end of a table row. Built on the native popover, so it opens
 * in the top layer (tables never clip it), closes on Escape or an outside click, and is
 * placed next to its button when it opens.
 */
export function RowMenu({ label, items }: { label: string; items: RowMenuItem[] }) {
  const id = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const place = () => {
    const button = buttonRef.current
    const menu = menuRef.current
    if (!button || !menu) return
    const rect = button.getBoundingClientRect()
    const height = menu.offsetHeight
    const openUp = rect.bottom + height + 8 > window.innerHeight && rect.top > height + 8
    menu.style.top = `${openUp ? rect.top - height - 4 : rect.bottom + 4}px`
    menu.style.left = `${Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8))}px`
  }

  const focusItem = (index: number) => {
    const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')
    if (!buttons?.length) return
    buttons[(index + buttons.length) % buttons.length]?.focus()
  }

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
    )
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'ArrowDown') focusItem(current + 1)
    else if (e.key === 'ArrowUp') focusItem(current - 1)
    else if (e.key === 'Home') focusItem(0)
    else if (e.key === 'End') focusItem(buttons.length - 1)
    else if (e.key === 'Tab') menuRef.current?.hidePopover()
    else return
    e.preventDefault()
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        popoverTarget={id}
        aria-haspopup="menu"
        aria-label={label}
        title="Actions"
        className="grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-accent hover:text-foreground"
      >
        <MoreHorizontal className="size-4" />
      </button>
      <div
        ref={menuRef}
        id={id}
        popover="auto"
        role="menu"
        aria-label={label}
        onKeyDown={onMenuKeyDown}
        onToggle={(e) => {
          if (e.newState === 'open') {
            place()
            focusItem(0)
          } else {
            buttonRef.current?.focus()
          }
        }}
        style={{ width: MENU_WIDTH }}
        className="fixed m-0 rounded-md border border-border bg-surface p-1 text-foreground shadow-[0_8px_24px_rgb(22_24_42/0.14)]"
      >
        {items.map(({ label: itemLabel, icon: Icon, onSelect, tone, separated }) => (
          <div key={itemLabel}>
            {separated && <div role="separator" className="my-1 border-t border-rule" />}
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                menuRef.current?.hidePopover()
                onSelect()
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline-offset-0',
                tone === 'danger'
                  ? 'text-danger hover:bg-danger-soft focus-visible:bg-danger-soft'
                  : 'hover:bg-accent focus-visible:bg-accent',
              )}
            >
              <Icon aria-hidden className="size-4 shrink-0" />
              {itemLabel}
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
