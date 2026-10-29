import { describe, expect, it } from 'vitest'
import { fullName, userFormSchema } from './schemas'

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
    const base = {
      username: 'sita.sharma',
      phoneNumber: '9800000000',
      email: 'sita@example.com',
      userType: 'admin' as const,
      bankCode: '',
      status: 'active' as const,
    }
    expect(
      userFormSchema.safeParse({ ...base, firstName: 'Sita', middleName: '', lastName: 'Sharma' })
        .success,
    ).toBe(true)
    const missing = userFormSchema.safeParse({
      ...base,
      firstName: ' ',
      middleName: '',
      lastName: '',
    })
    expect(missing.error?.issues.map((i) => i.path[0])).toEqual(['firstName', 'lastName'])
  })
})
