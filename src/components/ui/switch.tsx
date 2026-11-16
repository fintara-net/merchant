import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps extends Omit<ComponentProps<'button'>, 'onChange'> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function Switch({ checked, onCheckedChange, className, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-[#b9c1cd]',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-block size-4 rounded-full bg-white shadow-[0_1px_2px_rgb(20_25_42/0.25)] transition-transform',
          checked ? 'translate-x-4.5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
