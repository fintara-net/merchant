import { describe, expect, it } from 'vitest'
import { recoveryCodeSchema, twoFactorCodeSchema } from './api'

describe('twoFactorCodeSchema', () => {
  it('accepts six digits, with spaces or a dash as apps show them', () => {
    expect(twoFactorCodeSchema.parse({ code: '123456' }).code).toBe('123456')
    expect(twoFactorCodeSchema.parse({ code: '123 456' }).code).toBe('123456')
    expect(twoFactorCodeSchema.parse({ code: ' 123-456 ' }).code).toBe('123456')
  })

  it('refuses anything else', () => {
    for (const code of ['', '12345', '1234567', '12a456']) {
      expect(twoFactorCodeSchema.safeParse({ code }).success).toBe(false)
    }
  })
})

describe('recoveryCodeSchema', () => {
  it('needs a code', () => {
    expect(recoveryCodeSchema.safeParse({ recoveryCode: '   ' }).success).toBe(false)
    expect(recoveryCodeSchema.parse({ recoveryCode: ' k7qm2-xr4td ' }).recoveryCode).toBe(
      'k7qm2-xr4td',
    )
  })
})
