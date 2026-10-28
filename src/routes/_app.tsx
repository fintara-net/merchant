import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { sessionQueryOptions } from '@/features/auth/api'
import { permissionsQueryOptions } from '@/features/permissions'
import { isUnauthorized } from '@/lib/api-client'

/** Pathless layout: every route under `_app/` requires a signed-in user. */
export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context: { queryClient }, location }) => {
    try {
      const [user] = await Promise.all([
        queryClient.ensureQueryData(sessionQueryOptions),
        queryClient.ensureQueryData(permissionsQueryOptions),
      ])
      return { user }
    } catch (error) {
      if (isUnauthorized(error)) {
        throw redirect({ to: '/login', search: { redirect: location.href } })
      }
      throw error
    }
  },
  component: AppShell,
})
