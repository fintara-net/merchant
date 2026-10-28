import { createFileRoute } from '@tanstack/react-router'
import { Page } from '@/components/layout/page'
import { PERMISSIONS, requirePermission } from '@/features/permissions'

export const Route = createFileRoute('/_app/users/')({
  beforeLoad: ({ context }) => requirePermission(context.queryClient, PERMISSIONS.USERS_READ),
  component: UsersPage,
})

function UsersPage() {
  return <Page title="User management" />
}
