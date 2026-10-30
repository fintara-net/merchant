import { describe, expect, it } from 'vitest'
import { merchantFormSchema } from './schemas'

const valid = {
  name: 'Himalayan Electronics',
  merchantCode: 'mer00001',
  panNumber: '601234567',
  phoneNumber: '9801234567',
  email: 'Accounts@Example.com',
  status: 'active' as const,
}

describe('merchantFormSchema', () => {
  it('accepts valid input and normalises code and email', () => {
    const result = merchantFormSchema.parse(valid)
    expect(result.merchantCode).toBe('MER00001')
    expect(result.email).toBe('accounts@example.com')
  })

  it('rejects a PAN that is not 9 digits', () => {
    expect(merchantFormSchema.safeParse({ ...valid, panNumber: '12345' }).success).toBe(false)
  })

  it('rejects a phone number not starting with 9', () => {
    expect(merchantFormSchema.safeParse({ ...valid, phoneNumber: '8801234567' }).success).toBe(
      false,
    )
  })

  it('rejects merchant codes with symbols', () => {
    expect(merchantFormSchema.safeParse({ ...valid, merchantCode: 'MER-01' }).success).toBe(false)
  })
})
