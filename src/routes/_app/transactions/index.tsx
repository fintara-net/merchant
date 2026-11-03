import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { FileSpreadsheet } from 'lucide-react'
import { useCallback } from 'react'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { sessionQueryOptions } from '@/features/auth/api'
import { Can, PERMISSIONS, requirePermission } from '@/features/permissions'
import {
  applyScope,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  transactionSearchSchema,
  TransactionFilters,
  TransactionsTable,
  transactionScope,
  transactionsQueryOptions,
  type TransactionSearch,
} from '@/features/transactions'

export const Route = createFileRoute('/_app/transactions/')({
  validateSearch: transactionSearchSchema,
  beforeLoad: ({ context }) =>
    requirePermission(context.queryClient, PERMISSIONS.TRANSACTIONS_READ),
  component: TransactionsPage,
})

function TransactionsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: user } = useSuspenseQuery(sessionQueryOptions)
  const scope = transactionScope(user)
  // The backend applies the same bank/merchant restriction from the signed-in user
  const filters = applyScope(search, scope)
  const { data, isError } = useQuery(transactionsQueryOptions(filters))

  const page = search.page ?? 1
  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE
  const transactions = data?.items ?? []
  const total = data?.total ?? 0

  // Any filter change goes back to page 1, unless the change *is* the page
  const update = useCallback(
    (patch: Partial<TransactionSearch>) =>
      void navigate({ search: (prev) => ({ ...prev, page: undefined, ...patch }), replace: true }),
    [navigate],
  )

  return (
    <Page
      title="Transaction List"
      description={scope.organisationName ?? undefined}
      actions={
        <Can permission={PERMISSIONS.TRANSACTIONS_EXPORT}>
          <Button disabled={total === 0} title={total === 0 ? 'Nothing to export yet' : undefined}>
            <FileSpreadsheet className="size-4" /> Export to Excel
          </Button>
        </Can>
      }
    >
      <TransactionFilters
        value={filters}
        onChange={update}
        showBankFilter={scope.showBankFilter}
        showMerchantFilter={scope.showMerchantFilter}
      />

      {isError && (
        <p role="alert" className="mt-5 rounded-lg bg-danger/10 p-3 text-sm text-danger">
          Couldn't load transactions. Please try again.
        </p>
      )}

      <div className="mt-5">
        <TransactionsTable
          transactions={transactions}
          startIndex={(page - 1) * pageSize}
          hideBankColumn={!scope.showBankColumn}
        />
      </div>

      <div className="mt-5">
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          pageSizeOptions={PAGE_SIZES}
          onPageChange={(p) => update({ page: p })}
          onPageSizeChange={(size) => update({ pageSize: size })}
        />
      </div>
    </Page>
  )
}
