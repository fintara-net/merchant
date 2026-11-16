import { z } from 'zod'

// ── Filter options ────────────────────────────────────────────
// Change values/labels here only. Keep the values in sync with what the API returns.

export const DATE_RANGES = ['today', 'yesterday', '7d', '30d', 'month'] as const
export type DateRange = (typeof DATE_RANGES)[number]
export const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  month: 'This month',
}
export const DEFAULT_DATE_RANGE: DateRange = '7d'

export const TRANSACTION_STATUSES = ['success', 'failed'] as const
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number]
export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  success: 'Successful',
  failed: 'Failed',
}

export const PAYMENT_MODES = ['card', 'qr'] as const
export type PaymentMode = (typeof PAYMENT_MODES)[number]
export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  card: 'Card',
  qr: 'QR',
}

export const SEARCH_FIELDS = ['tid', 'rrn', 'card', 'store'] as const
export type SearchField = (typeof SEARCH_FIELDS)[number]
export const SEARCH_FIELD_LABELS: Record<SearchField, string> = {
  tid: 'Terminal ID',
  rrn: 'RRN / reference',
  card: 'Card number',
  store: 'Store name',
}

export const SEARCH_FIELD_PLACEHOLDERS: Record<SearchField, string> = {
  tid: 'Search by terminal ID',
  rrn: 'Search by RRN or reference',
  card: 'Search by card number',
  store: 'Search by store name',
}

export const PAGE_SIZES = [10, 25, 50] as const
export const DEFAULT_PAGE_SIZE = 10

/**
 * URL search params for /transactions — filters survive refresh and can be shared.
 * `.catch(undefined)` drops unknown values (e.g. an old link) instead of showing an error page.
 */
export const transactionSearchSchema = z.object({
  range: z.enum(DATE_RANGES).optional().catch(undefined),
  status: z.enum(TRANSACTION_STATUSES).optional().catch(undefined),
  mode: z.enum(PAYMENT_MODES).optional().catch(undefined),
  /** Issuing bank id */
  bank: z.string().optional().catch(undefined),
  /** Merchant id */
  merchant: z.string().optional().catch(undefined),
  searchBy: z.enum(SEARCH_FIELDS).optional().catch(undefined),
  q: z.string().optional().catch(undefined),
  page: z.number().int().positive().optional().catch(undefined),
  pageSize: z.number().int().positive().max(100).optional().catch(undefined),
})
export type TransactionSearch = z.infer<typeof transactionSearchSchema>

// ── Transaction row ───────────────────────────────────────────

export const transactionSchema = z.object({
  id: z.string(),
  storeName: z.string(),
  storeAddress: z.string(),
  terminalId: z.string(),
  rrn: z.string(),
  bankName: z.string(),
  /** Must already be masked by the API, e.g. 451132******5037 */
  cardNumber: z.string(),
  approvalCode: z.string(),
  createdAt: z.string(),
  /** Minor units (paisa) to avoid floating-point errors */
  amount: z.number().int(),
  currency: z.string().length(3),
  tenureMonths: z.number().int(),
  paymentMode: z.enum(PAYMENT_MODES),
  status: z.enum(TRANSACTION_STATUSES),
})
export type Transaction = z.infer<typeof transactionSchema>
