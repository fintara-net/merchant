import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useOrganisationOptions } from '@/features/organisations'
import { cn } from '@/lib/utils'
import {
  PAYMENT_MODE_LABELS,
  PAYMENT_MODES,
  SEARCH_FIELD_LABELS,
  SEARCH_FIELD_PLACEHOLDERS,
  SEARCH_FIELDS,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_STATUSES,
  type PaymentMode,
  type SearchField,
  type TransactionSearch,
  type TransactionStatus,
} from '../schemas'

interface TransactionFiltersProps {
  value: TransactionSearch
  onChange: (patch: Partial<TransactionSearch>) => void
  /** Hidden for bank users: it's always their own bank */
  showBankFilter?: boolean
  /** Hidden for merchant users: it's always themselves */
  showMerchantFilter?: boolean
}

/** Search box with a "search by" picker, for the toolbar row above the register. */
export function TransactionSearchBar({
  value,
  onChange,
}: Pick<TransactionFiltersProps, 'value' | 'onChange'>) {
  const searchBy = value.searchBy ?? 'tid'
  return (
    <div className="flex w-full gap-2 sm:w-auto">
      <div className="w-36 shrink-0">
        <Select
          aria-label="Search by"
          value={searchBy}
          onChange={(e) => onChange({ searchBy: e.target.value as SearchField })}
        >
          {SEARCH_FIELDS.map((f) => (
            <option key={f} value={f}>
              {SEARCH_FIELD_LABELS[f]}
            </option>
          ))}
        </Select>
      </div>
      <SearchBox
        // Remount when the URL value changes from outside (e.g. back button)
        key={value.q ?? ''}
        initial={value.q ?? ''}
        label={SEARCH_FIELD_PLACEHOLDERS[searchBy]}
        onSearch={(q) => onChange({ q: q || undefined })}
      />
    </div>
  )
}

/**
 * The dropdown filters, in their own row above the register. Each dropdown's first option
 * names what it filters ("All statuses"), so they need no separate labels.
 */
export function TransactionFilters({
  value,
  onChange,
  showBankFilter = true,
  showMerchantFilter = true,
}: TransactionFiltersProps) {
  const { banks, merchants } = useOrganisationOptions()

  return (
    <div className="grid grid-cols-2 gap-2 border-b border-border bg-surface-sunken px-4 py-3 sm:flex sm:flex-wrap">
      <Select
        aria-label="Status"
        className="sm:w-40"
        value={value.status ?? ''}
        onChange={(e) =>
          onChange({ status: (e.target.value || undefined) as TransactionStatus | undefined })
        }
      >
        <option value="">All statuses</option>
        {TRANSACTION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {TRANSACTION_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Payment mode"
        className="sm:w-48"
        value={value.mode ?? ''}
        onChange={(e) =>
          onChange({ mode: (e.target.value || undefined) as PaymentMode | undefined })
        }
      >
        <option value="">All modes</option>
        {PAYMENT_MODES.map((m) => (
          <option key={m} value={m}>
            {PAYMENT_MODE_LABELS[m]}
          </option>
        ))}
      </Select>

      {showBankFilter && (
        <ClearableSelect
          label="Issuing bank"
          value={value.bank}
          allLabel="All banks"
          options={banks}
          onChange={(bank) => onChange({ bank })}
        />
      )}

      {showMerchantFilter && (
        <ClearableSelect
          label="Merchant"
          value={value.merchant}
          allLabel="All merchants"
          options={merchants}
          onChange={(merchant) => onChange({ merchant })}
        />
      )}
    </div>
  )
}

/** Dropdown with an "All" option and an × button to go back to it */
function ClearableSelect({
  label,
  value,
  allLabel,
  options,
  onChange,
}: {
  label: string
  value: string | undefined
  allLabel: string
  options: readonly { id: string; name: string }[]
  onChange: (value: string | undefined) => void
}) {
  return (
    <div className="relative sm:w-52">
      <Select
        aria-label={label}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={value ? 'pr-16' : undefined}
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </Select>
      {value && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          aria-label={`Clear ${label.toLowerCase()}`}
          className="absolute top-1/2 right-8 grid size-6 -translate-y-1/2 place-items-center rounded-sm text-muted hover:bg-accent hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

/** Updates the search 300ms after typing stops, so we don't fire a request per keystroke. */
function SearchBox({
  initial,
  label,
  className,
  onSearch,
}: {
  initial: string
  label: string
  className?: string
  onSearch: (q: string) => void
}) {
  const [text, setText] = useState(initial)

  useEffect(() => {
    if (text.trim() === initial) return
    const timer = setTimeout(() => onSearch(text.trim()), 300)
    return () => clearTimeout(timer)
  }, [text, initial, onSearch])

  return (
    <div className={cn('relative min-w-0 flex-1 sm:w-64 sm:flex-none', className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
      />
      <Input
        type="search"
        aria-label={label}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={label}
        className="pl-9"
      />
    </div>
  )
}
