import { createFileRoute } from '@tanstack/react-router'
import { Page } from '@/components/layout/page'
import { PERMISSIONS, requirePermission } from '@/features/permissions'

export const Route = createFileRoute('/_app/transactions/')({
  beforeLoad: ({ context }) =>
    requirePermission(context.queryClient, PERMISSIONS.TRANSACTIONS_READ),
  component: TransactionsPage,
})

function TransactionsPage() {
  return <Page title="Transactions" />
}
