import { describe, expect, it } from 'vitest'
import { hasAll, hasAny, PERMISSIONS } from './permissions'

describe('permission helpers', () => {
  const granted = [PERMISSIONS.TRANSACTIONS_READ, PERMISSIONS.USERS_READ]

  it('hasAll requires every permission', () => {
    expect(hasAll(granted, [PERMISSIONS.TRANSACTIONS_READ])).toBe(true)
    expect(hasAll(granted, [PERMISSIONS.TRANSACTIONS_READ, PERMISSIONS.USERS_MANAGE])).toBe(false)
  })

  it('hasAny requires at least one', () => {
    expect(hasAny(granted, [PERMISSIONS.USERS_MANAGE, PERMISSIONS.USERS_READ])).toBe(true)
    expect(hasAny(granted, [PERMISSIONS.USERS_MANAGE])).toBe(false)
  })
})
