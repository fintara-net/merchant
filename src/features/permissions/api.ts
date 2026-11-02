import { type QueryClient, queryOptions } from '@tanstack/react-query'
import { sessionQueryOptions } from '@/features/auth/api'

/** Permissions come with the signed-in user from GET /me, so this reads the same cached query. */
export const permissionsQueryOptions = queryOptions({
  ...sessionQueryOptions,
  select: (user) => user.permissions,
})

/** For route guards: `ensureQueryData` ignores `select`, so pick the permissions here. */
export async function loadPermissions(queryClient: QueryClient) {
  return (await queryClient.ensureQueryData(sessionQueryOptions)).permissions
}
