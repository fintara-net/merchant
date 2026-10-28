import type { ReactNode } from 'react'
import type { Permission } from './permissions'
import { usePermissions } from './use-permissions'

interface CanProps {
  /** All listed permissions are required */
  permission: Permission | Permission[]
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Hides UI the user isn't allowed to use. This is a UX convenience only —
 * the backend must still enforce every permission.
 */
export function Can({ permission, children, fallback = null }: CanProps) {
  const { can } = usePermissions()
  const required = Array.isArray(permission) ? permission : [permission]
  return can(...required) ? children : fallback
}
