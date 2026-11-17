import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { CircleAlert, FileSpreadsheet, ReceiptText, SearchX } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { Segmented } from '@/components/ui/segmented'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/table'
import { sessionQueryOptions } from '@/features/auth/api'
import { Can, PERMISSIONS, requirePermission } from '@/features/permissions'
import {
  applyScope,
  DATE_RANGE_LABELS,
  DATE_RANGES,
  DEFAULT_DATE_RANGE,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  transactionSearchSchema,
  TransactionDetails,
  TransactionFilters,
  TransactionSearchBar,
  TransactionsTable,
  transactionScope,
  transactionsQueryOptions,
  type DateRange,
  type Transaction,
  type TransactionSearch,
} from '@/features/transactions'

export const Route = createFileRoute('/_app/transactions/')({
  validateSearch: transactionSearchSchema,
  beforeLoad: ({ context }) =>
    requirePermission(context.queryClient, PERMISSIONS.TRANSACTIONS_READ),
  component: TransactionsPage,
})

const RANGE_OPTIONS = DATE_RANGES.map((r) => ({ value: r, label: DATE_RANGE_LABELS[r] }))
const COUNT = new Intl.NumberFormat('en-IN')

/** "No transactions …" reads naturally for every period */
const PERIOD_PHRASE: Record<DateRange, string> = {
  today: 'today',
  yesterday: 'yesterday',
  '7d': 'in the last 7 days',
  '30d': 'in the last 30 days',
  month: 'this month',
}

function TransactionsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: user } = useSuspenseQuery(sessionQueryOptions)
  const scope = transactionScope(user)
  // The backend applies the same bank/merchant restriction from the signed-in user
  const filters = applyScope(search, scope)
  const { data, isPending, isError, refetch } = useQuery(transactionsQueryOptions(filters))
  const [open, setOpen] = useState<Transaction | null>(null)

  const range = search.range ?? DEFAULT_DATE_RANGE
  const page = search.page ?? 1
  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE
  const transactions = data?.items ?? []
  const total = data?.total ?? 0
  // Filters the user chose in the toolbar (the period is always set)
  const filtered = Boolean(
    search.status ||
    search.mode ||
    search.q ||
    (scope.showBankFilter && search.bank) ||
    (scope.showMerchantFilter && search.merchant),
  )

  // Any filter change goes back to page 1, unless the change *is* the page
  const update = useCallback(
    (patch: Partial<TransactionSearch>) =>
      void navigate({ search: (prev) => ({ ...prev, page: undefined, ...patch }), replace: true }),
    [navigate],
  )
  const clearFilters = () =>
    void navigate({ search: (prev) => ({ range: prev.range, pageSize: prev.pageSize }) })

  const period = DATE_RANGE_LABELS[range]
  const description = `${scope.organisationName ?? 'All banks and merchants'}, ${period.toLowerCase()}`

  const empty = filtered ? (
    <EmptyState
      icon={<SearchX />}
      title="No transactions match these filters"
      description={`Nothing ${PERIOD_PHRASE[range]} matches. Try another filter or a longer period.`}
      action={
        <Button variant="outline" onClick={clearFilters}>
          Clear filters
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={<ReceiptText />}
      title={`No transactions ${PERIOD_PHRASE[range]}`}
      description="Card and QR payments appear here as they are processed. Try a longer period if you expected some."
    />
  )

  return (
    <Page
      title="Transactions"
      description={description}
      figures={
        data
          ? [{ label: 'Transactions', value: COUNT.format(total), note: 'In this period' }]
          : undefined
      }
      bandAside={
        <>
          {/* Phone: a dropdown; the button strip doesn't fit */}
          <div className="w-full sm:hidden">
            <Select
              aria-label="Period"
              value={range}
              onChange={(e) => update({ range: e.target.value as DateRange })}
            >
              {RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <Segmented
            label="Period"
            options={RANGE_OPTIONS}
            value={range}
            onChange={(r) => update({ range: r })}
            className="hidden sm:inline-flex"
          />
        </>
      }
      toolbar={<TransactionSearchBar value={filters} onChange={update} />}
      actions={
        <Can permission={PERMISSIONS.TRANSACTIONS_EXPORT}>
          {/* Export is built once transactions are connected */}
          <Button
            variant="outline"
            disabled
            title="Excel export isn't available yet"
            className="hidden sm:inline-flex"
          >
            <FileSpreadsheet /> Export
          </Button>
        </Can>
      }
      flush
    >
      <TransactionFilters
        value={filters}
        onChange={update}
        showBankFilter={scope.showBankFilter}
        showMerchantFilter={scope.showMerchantFilter}
      />
      {isError ? (
        <EmptyState
          icon={<CircleAlert />}
          title="Couldn't load transactions"
          description="Check your connection, then try again."
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      ) : (
        <>
          <TransactionsTable
            transactions={transactions}
            loading={isPending}
            onOpen={setOpen}
            hideBankColumn={!scope.showBankColumn}
            empty={empty}
          />
          {total > 0 && (
            <div className="border-t border-border px-4 py-3">
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                pageSizeOptions={PAGE_SIZES}
                onPageChange={(p) => update({ page: p })}
                onPageSizeChange={(size) => update({ pageSize: size })}
              />
            </div>
          )}
        </>
      )}

      <TransactionDetails
        transaction={open}
        onClose={() => setOpen(null)}
        showBank={scope.showBankColumn}
      />
    </Page>
  )
}
