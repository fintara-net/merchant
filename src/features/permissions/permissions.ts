/**
 * Single source of truth for permission keys the frontend knows about.
 * Must match the keys returned by the permissions API.
 */
export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard:view',
  TRANSACTIONS_READ: 'transactions:read',
  TRANSACTIONS_EXPORT: 'transactions:export',
  ISSUING_BANKS_READ: 'issuing_banks:read',
  ISSUING_BANKS_MANAGE: 'issuing_banks:manage',
  MERCHANTS_READ: 'merchants:read',
  MERCHANTS_MANAGE: 'merchants:manage',
  USERS_READ: 'users:read',
  USERS_MANAGE: 'users:manage',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export function hasAll(granted: readonly string[], required: readonly Permission[]) {
  return required.every((p) => granted.includes(p))
}

export function hasAny(granted: readonly string[], required: readonly Permission[]) {
  return required.some((p) => granted.includes(p))
}
