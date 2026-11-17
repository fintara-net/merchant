import { formatDateTime } from '@/lib/utils'

/** 500000 (paisa) → "NPR. 5,000". Uses Nepali/Indian digit grouping (1,00,000). */
export function formatAmount(minor: number, currency = 'NPR') {
  const value = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(minor / 100)
  return `${currency}. ${value}`
}

const MONEY = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * 500000 (paisa) → "5,000.00" for statement columns, where the header names the currency.
 * Nepali/Indian digit grouping (1,00,000.00).
 */
export function formatMoney(minor: number) {
  return MONEY.format(minor / 100)
}

/** ISO date → "2026-Oct-28 11:07 AM" in the viewer's local time */
export const formatTransactionDate = formatDateTime

/**
 * Safety net: never show a full card number even if one slips through.
 * Keeps the first 6 and last 4 digits, as in 451132******5037.
 */
export function maskCardNumber(card: string) {
  if (card.includes('*')) return card
  const digits = card.replace(/\D/g, '')
  if (digits.length < 12) return card
  return `${digits.slice(0, 6)}${'*'.repeat(digits.length - 10)}${digits.slice(-4)}`
}

export function formatTenure(months: number) {
  return `${months} ${months === 1 ? 'Month' : 'Months'}`
}
