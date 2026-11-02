import { createFileRoute, redirect } from '@tanstack/react-router'
import { Page } from '@/components/layout/page'
import { loadPermissions, PERMISSIONS, requirePermission } from '@/features/permissions'

export const Route = createFileRoute('/_app/')({
  beforeLoad: async ({ context }) => {
    // Bank and merchant users have no Overview: send them to their transactions
    const granted = await loadPermissions(context.queryClient)
    if (
      !granted.includes(PERMISSIONS.DASHBOARD_VIEW) &&
      granted.includes(PERMISSIONS.TRANSACTIONS_READ)
    ) {
      throw redirect({ to: '/transactions' })
    }
    await requirePermission(context.queryClient, PERMISSIONS.DASHBOARD_VIEW)
  },
  component: OverviewPage,
})

function OverviewPage() {
  return <Page title="Overview" />
}
