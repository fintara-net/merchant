import { Search, X } from 'lucide-react'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { Input, Label } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useIssuingBanks } from '@/features/issuing-banks'
import { useMerchants } from '@/features/merchants'
import { cn } from '@/lib/utils'
import {
  DATE_RANGE_LABELS,
  DATE_RANGES,
  DEFAULT_DATE_RANGE,
  PAYMENT_MODE_LABELS,
  PAYMENT_MODES,
  SEARCH_FIELD_LABELS,
  SEARCH_FIELDS,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_STATUSES,
  type DateRange,
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

/**
 * Layout per number of dropdowns. Container queries make it follow the card
 * width, so it adapts when the sidebar collapses. Five dropdowns need a wider
 * card before everything fits on one line.
 */
const LAYOUT = {
  4: {
    row: '@5xl:flex-nowrap',
    grid: '@2xl:grid-cols-4 @5xl:w-auto @5xl:grid-cols-[repeat(4,9rem)]',
    search: '@5xl:w-auto',
    searchBy: '@5xl:w-44',
    searchBox: '@5xl:w-52 @5xl:flex-none',
  },
  5: {
    row: '@7xl:flex-nowrap',
    grid: '@2xl:grid-cols-3 @4xl:grid-cols-5 @7xl:w-auto @7xl:grid-cols-[repeat(5,9rem)]',
    search: '@7xl:w-auto',
    searchBy: '@7xl:w-44',
    searchBox: '@7xl:w-52 @7xl:flex-none',
  },
} as const

export function TransactionFilters({
  value,
  onChange,
  showBankFilter = true,
  showMerchantFilter = true,
}: TransactionFiltersProps) {
  const banks = useIssuingBanks((s) => s.banks)
  const merchants = useMerchants((s) => s.merchants)
  const searchBy = value.searchBy ?? 'tid'
  const layout = LAYOUT[showBankFilter && showMerchantFilter ? 5 : 4]

  return (
    <div className="@container">
      <div className={cn('flex flex-wrap items-end justify-between gap-4', layout.row)}>
        <div className={cn('grid w-full grid-cols-2 gap-3', layout.grid)}>
          <Field label="Date Range">
            {(id) => (
              <Select
                id={id}
                value={value.range ?? DEFAULT_DATE_RANGE}
                onChange={(e) => onChange({ range: e.target.value as DateRange })}
              >
                {DATE_RANGES.map((r) => (
                  <option key={r} value={r}>
                    {DATE_RANGE_LABELS[r]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Transaction Status">
            {(id) => (
              <Select
                id={id}
                value={value.status ?? ''}
                onChange={(e) =>
                  onChange({
                    status: (e.target.value || undefined) as TransactionStatus | undefined,
                  })
                }
              >
                <option value="">All</option>
                {TRANSACTION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {TRANSACTION_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Payment Mode">
            {(id) => (
              <Select
                id={id}
                value={value.mode ?? ''}
                onChange={(e) =>
                  onChange({ mode: (e.target.value || undefined) as PaymentMode | undefined })
                }
              >
                <option value="">All</option>
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_MODE_LABELS[m]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          {showBankFilter && (
            <Field label="Issuing Bank">
              {(id) => (
                <ClearableSelect
                  id={id}
                  value={value.bank}
                  allLabel="All Banks"
                  clearLabel="Clear issuing bank"
                  options={banks}
                  onChange={(bank) => onChange({ bank })}
                />
              )}
            </Field>
          )}

          {showMerchantFilter && (
            <Field label="Merchant">
              {(id) => (
                <ClearableSelect
                  id={id}
                  value={value.merchant}
                  allLabel="All Merchants"
                  clearLabel="Clear merchant"
                  options={merchants}
                  onChange={(merchant) => onChange({ merchant })}
                />
              )}
            </Field>
          )}
        </div>

        <div className={cn('flex w-full flex-col gap-3 @lg:flex-row', layout.search)}>
          <div className={cn('@lg:w-1/2', layout.searchBy)}>
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
            placeholder={`Search ${SEARCH_FIELD_LABELS[searchBy]}`}
            className={layout.searchBox}
            onSearch={(q) => onChange({ q: q || undefined })}
          />
        </div>
      </div>
    </div>
  )
}

/** Dropdown with an "All" option and an × button to go back to it */
function ClearableSelect({
  id,
  value,
  allLabel,
  clearLabel,
  options,
  onChange,
}: {
  id: string
  value: string | undefined
  allLabel: string
  clearLabel: string
  options: readonly { id: string; name: string }[]
  onChange: (value: string | undefined) => void
}) {
  return (
    <div className="relative">
      <Select
        id={id}
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
          aria-label={clearLabel}
          className="absolute top-1/2 right-8 grid size-6 -translate-y-1/2 place-items-center rounded text-muted hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="font-medium">
        {label}
      </Label>
      {children(id)}
    </div>
  )
}

/** Updates the search 300ms after typing stops, so we don't fire a request per keystroke. */
function SearchBox({
  initial,
  placeholder,
  className,
  onSearch,
}: {
  initial: string
  placeholder: string
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
    <div className={cn('relative @lg:flex-1', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
      <Input
        type="search"
        aria-label="Search transactions"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  )
}
