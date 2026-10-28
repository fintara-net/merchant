import { createFileRoute } from '@tanstack/react-router'
import { Page } from '@/components/layout/page'
import { PERMISSIONS, requirePermission } from '@/features/permissions'

export const Route = createFileRoute('/_app/')({
  beforeLoad: ({ context }) => requirePermission(context.queryClient, PERMISSIONS.DASHBOARD_VIEW),
  component: OverviewPage,
})

function OverviewPage() {
  return <Page title="Overview" />
}
