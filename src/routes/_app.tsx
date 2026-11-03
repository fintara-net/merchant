import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { logout, sessionQueryOptions } from '@/features/auth/api'
import { ApiError, isUnauthorized } from '@/lib/api-client'

/** Pathless layout: every route under `_app/` requires a signed-in user. */
export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context: { queryClient }, location }) => {
    try {
      // One request gives the user and their permissions
      const user = await queryClient.ensureQueryData(sessionQueryOptions)
      // A temporary password must be replaced first (the API refuses everything else too)
      if (user.mustChangePassword) throw redirect({ to: '/change-password' })
      return { user }
    } catch (error) {
      if (isUnauthorized(error)) {
        throw redirect({ to: '/login', search: { redirect: location.href } })
      }
      // Signed in, but this account may not use the dashboard: end the session
      if (error instanceof ApiError && error.status === 403) {
        await logout().catch(() => undefined)
        throw redirect({ to: '/login' })
      }
      throw error
    }
  },
  component: AppShell,
})
