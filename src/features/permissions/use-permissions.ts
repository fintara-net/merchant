import { useQuery } from '@tanstack/react-query'
import { permissionsQueryOptions } from './api'
import { hasAll, hasAny, type Permission } from './permissions'

/** Deny-by-default: while loading or on error, no permissions are granted. */
export function usePermissions() {
  const { data = [], isPending } = useQuery(permissionsQueryOptions)
  return {
    permissions: data,
    isPending,
    can: (...required: Permission[]) => hasAll(data, required),
    canAny: (...required: Permission[]) => hasAny(data, required),
  }
}
