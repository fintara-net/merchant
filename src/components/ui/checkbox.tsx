import { useEffect, useRef, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type'> {
  /** Shows a dash, e.g. a "select all" box when only some rows are selected */
  indeterminate?: boolean
}

export function Checkbox({ indeterminate = false, className, ...props }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null)

  // `indeterminate` can only be set from JavaScript, not as an HTML attribute
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'size-4 cursor-pointer rounded-sm accent-primary disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
