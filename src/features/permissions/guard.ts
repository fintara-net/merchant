import type { QueryClient } from '@tanstack/react-query'
import { redirect } from '@tanstack/react-router'
import { loadPermissions } from './api'
import { hasAll, type Permission } from './permissions'

/** Use in a route's `beforeLoad` to block navigation without the required permissions. */
export async function requirePermission(queryClient: QueryClient, ...required: Permission[]) {
  const granted = await loadPermissions(queryClient)
  if (!hasAll(granted, required)) {
    throw redirect({ to: '/forbidden' })
  }
}
