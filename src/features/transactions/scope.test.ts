import { describe, expect, it } from 'vitest'
import { applyScope, transactionScope } from './scope'

const bankUser = { userType: 'bank' as const, organisation: { id: 'bank_1', name: 'Nabil Bank' } }
const merchantUser = {
  userType: 'merchant' as const,
  organisation: { id: 'mer_1', name: 'Himalayan Electronics' },
}
const superAdmin = { userType: 'super-admin' as const, organisation: null }

describe('transactionScope', () => {
  it('gives super admins every filter and column', () => {
    expect(transactionScope(superAdmin)).toMatchObject({
      showBankFilter: true,
      showMerchantFilter: true,
      showBankColumn: true,
      locked: {},
    })
  })

  it('hides the bank filter and column from bank users', () => {
    expect(transactionScope(bankUser)).toMatchObject({
      showBankFilter: false,
      showMerchantFilter: true,
      showBankColumn: false,
      organisationName: 'Nabil Bank',
    })
  })

  it('hides the merchant filter from merchant users', () => {
    expect(transactionScope(merchantUser)).toMatchObject({
      showBankFilter: true,
      showMerchantFilter: false,
    })
  })
})

describe('applyScope', () => {
  it("overrides a bank picked in the URL with the user's own bank", () => {
    const scope = transactionScope(bankUser)
    expect(applyScope({ bank: 'bank_2', status: 'success' }, scope)).toEqual({
      bank: 'bank_1',
      status: 'success',
    })
  })

  it("overrides a merchant picked in the URL with the merchant's own id", () => {
    expect(applyScope({ merchant: 'mer_9' }, transactionScope(merchantUser))).toEqual({
      merchant: 'mer_1',
    })
  })

  it('leaves super admin filters as they are', () => {
    expect(applyScope({ bank: 'bank_2', merchant: 'mer_3' }, transactionScope(superAdmin))).toEqual(
      { bank: 'bank_2', merchant: 'mer_3' },
    )
  })
})
