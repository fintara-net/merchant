import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './input'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  /** Also the accessible name, e.g. "Search banks" */
  label: string
  placeholder?: string
  className?: string
}

/** Search box for a table toolbar, with a clear button once something is typed. */
export function SearchInput({ value, onChange, label, placeholder, className }: SearchInputProps) {
  return (
    <div className={cn('relative w-full sm:w-64', className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
      />
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder ?? label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-1.5 grid size-6 -translate-y-1/2 place-items-center rounded-sm text-muted hover:bg-accent hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
