import { describe, expect, it } from 'vitest'
import { fullName, userFormSchema, type UserFormInput } from './schemas'

const base: UserFormInput = {
  username: 'sita.sharma',
  firstName: 'Sita',
  middleName: '',
  lastName: 'Sharma',
  phoneNumber: '9800000000',
  email: 'sita@example.com',
  userType: 'super-admin',
  bankId: '',
  merchantId: '',
  status: 'active',
}

const errorPaths = (input: UserFormInput) =>
  userFormSchema.safeParse(input).error?.issues.map((i) => i.path[0]) ?? []

describe('user names', () => {
  it('joins first, middle and last name, skipping a missing middle name', () => {
    expect(fullName({ firstName: 'Prakash', middleName: 'Kumar', lastName: 'Paudel' })).toBe(
      'Prakash Kumar Paudel',
    )
    expect(fullName({ firstName: 'Sita', middleName: null, lastName: 'Sharma' })).toBe(
      'Sita Sharma',
    )
  })

  it('requires first and last name but not middle name', () => {
    expect(errorPaths(base)).toEqual([])
    expect(errorPaths({ ...base, firstName: ' ', lastName: '' })).toEqual(['firstName', 'lastName'])
  })
})

describe('user type and organisation', () => {
  it('requires a bank for bank users', () => {
    expect(errorPaths({ ...base, userType: 'bank' })).toEqual(['bankId'])
    expect(errorPaths({ ...base, userType: 'bank', bankId: 'bank_1' })).toEqual([])
  })

  it('requires a merchant for merchant users', () => {
    expect(errorPaths({ ...base, userType: 'merchant' })).toEqual(['merchantId'])
    expect(errorPaths({ ...base, userType: 'merchant', merchantId: 'mer_1' })).toEqual([])
  })

  it('keeps only the link that matches the user type', () => {
    const both = { bankId: 'bank_1', merchantId: 'mer_1' }
    expect(userFormSchema.parse({ ...base, ...both, userType: 'bank' })).toMatchObject({
      bankId: 'bank_1',
      merchantId: '',
    })
    expect(userFormSchema.parse({ ...base, ...both, userType: 'merchant' })).toMatchObject({
      bankId: '',
      merchantId: 'mer_1',
    })
    expect(userFormSchema.parse({ ...base, ...both, userType: 'super-admin' })).toMatchObject({
      bankId: '',
      merchantId: '',
    })
  })
})
