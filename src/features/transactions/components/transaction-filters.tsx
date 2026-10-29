import { Search, X } from 'lucide-react'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { Input, Label } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useIssuingBanks } from '@/features/issuing-banks'
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
}

export function TransactionFilters({ value, onChange }: TransactionFiltersProps) {
  const banks = useIssuingBanks((s) => s.banks)
  const searchBy = value.searchBy ?? 'tid'

  // Container queries: layout follows the card width, so it adapts when the sidebar collapses
  return (
    <div className="@container">
      <div className="flex flex-wrap items-end justify-between gap-4 @5xl:flex-nowrap">
        <div className="grid w-full grid-cols-2 gap-3 @2xl:grid-cols-4 @5xl:w-auto @5xl:grid-cols-[repeat(4,9rem)]">
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

          <Field label="Issuing Bank">
            {(id) => (
              <div className="relative">
                <Select
                  id={id}
                  value={value.bank ?? ''}
                  onChange={(e) => onChange({ bank: e.target.value || undefined })}
                  className={value.bank ? 'pr-16' : undefined}
                >
                  <option value="">All Banks</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
                {value.bank && (
                  <button
                    type="button"
                    onClick={() => onChange({ bank: undefined })}
                    aria-label="Clear issuing bank"
                    className="absolute top-1/2 right-8 grid size-6 -translate-y-1/2 place-items-center rounded text-muted hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            )}
          </Field>
        </div>

        <div className="flex w-full flex-col gap-3 @lg:flex-row @5xl:w-auto">
          <div className="@lg:w-1/2 @5xl:w-44">
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
            onSearch={(q) => onChange({ q: q || undefined })}
          />
        </div>
      </div>
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
  onSearch,
}: {
  initial: string
  placeholder: string
  onSearch: (q: string) => void
}) {
  const [text, setText] = useState(initial)

  useEffect(() => {
    if (text.trim() === initial) return
    const timer = setTimeout(() => onSearch(text.trim()), 300)
    return () => clearTimeout(timer)
  }, [text, initial, onSearch])

  return (
    <div className="relative @lg:flex-1 @5xl:w-52 @5xl:flex-none">
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
