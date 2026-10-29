import { describe, expect, it } from 'vitest'
import { formatAmount, formatTenure, formatTransactionDate, maskCardNumber } from './format'

describe('transaction formatting', () => {
  it('formats amounts from paisa with Nepali grouping', () => {
    expect(formatAmount(5_000_000)).toBe('NPR. 50,000')
    expect(formatAmount(10_000_000)).toBe('NPR. 1,00,000')
    expect(formatAmount(1_735_050)).toBe('NPR. 17,350.5')
  })

  it('formats dates like 2026-Oct-28 11:07 AM', () => {
    expect(formatTransactionDate(new Date(2026, 9, 28, 11, 7).toISOString())).toBe(
      '2026-Oct-28 11:07 AM',
    )
    expect(formatTransactionDate(new Date(2026, 9, 26, 15, 10).toISOString())).toBe(
      '2026-Oct-26 03:10 PM',
    )
    expect(formatTransactionDate('not a date')).toBe('—')
  })

  it('never shows a full card number', () => {
    expect(maskCardNumber('4511321234565037')).toBe('451132******5037')
    expect(maskCardNumber('451132******5037')).toBe('451132******5037')
  })

  it('formats tenure', () => {
    expect(formatTenure(12)).toBe('12 Months')
    expect(formatTenure(1)).toBe('1 Month')
  })
})

describe('transaction search params', () => {
  it('drops unknown filter values instead of failing', async () => {
    const { transactionSearchSchema } = await import('./schemas')
    expect(transactionSearchSchema.parse({ status: 'pending', mode: 'qr', page: -3 })).toEqual({
      mode: 'qr',
    })
  })
})
