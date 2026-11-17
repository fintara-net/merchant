import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { SkeletonRows } from '@/components/ui/skeleton'
import { Table, TBody, Td, TFoot, Th, THead } from '@/components/ui/table'
import { formatMoney, formatTransactionDate, maskCardNumber } from '../format'
import { PAYMENT_MODE_LABELS, TRANSACTION_STATUS_LABELS, type Transaction } from '../schemas'

interface TransactionsTableProps {
  transactions: Transaction[]
  loading?: boolean
  /** Opens a transaction's details */
  onOpen: (transaction: Transaction) => void
  /** Hide the bank column, e.g. for bank users who only see their own bank */
  hideBankColumn?: boolean
  /** Shown instead of rows when there are none */
  empty: ReactNode
}

export function TransactionStatusBadge({ status }: { status: Transaction['status'] }) {
  return (
    <Badge tone={status === 'success' ? 'success' : 'danger'}>
      {TRANSACTION_STATUS_LABELS[status]}
    </Badge>
  )
}

/** Successful amounts on this page; failed ones moved no money */
function pageTotal(transactions: Transaction[]) {
  return transactions.reduce((sum, t) => (t.status === 'success' ? sum + t.amount : sum), 0)
}

/**
 * The transaction register: one row per payment, amounts in their own right-aligned column,
 * and a total row for the page like the foot of a statement.
 */
export function TransactionsTable({
  transactions,
  loading = false,
  onOpen,
  hideBankColumn = false,
  empty,
}: TransactionsTableProps) {
  if (!loading && transactions.length === 0) return empty

  const columns = hideBankColumn ? 7 : 8
  const successful = transactions.filter((t) => t.status === 'success').length

  return (
    <>
      {/* Tablet & desktop: register */}
      <div className="hidden md:block">
        <Table>
          <THead>
            <tr>
              <Th>Date and time</Th>
              <Th>Store</Th>
              <Th>Terminal</Th>
              <Th>RRN / reference</Th>
              {!hideBankColumn && <Th>Issuing bank</Th>}
              <Th>Card</Th>
              <Th>Status</Th>
              <Th className="text-right">Amount (NPR)</Th>
            </tr>
          </THead>
          <TBody>
            {loading ? (
              <SkeletonRows rows={8} columns={columns} />
            ) : (
              transactions.map((t) => (
                <tr key={t.id} onClick={() => onOpen(t)} className="cursor-pointer">
                  <Td>{formatTransactionDate(t.createdAt)}</Td>
                  <Td className="max-w-56">
                    <span className="block truncate font-medium" title={t.storeName}>
                      {t.storeName}
                    </span>
                    <span className="block truncate text-xs text-muted" title={t.storeAddress}>
                      {t.storeAddress}
                    </span>
                  </Td>
                  <Td>{t.terminalId}</Td>
                  <Td>
                    {/* The whole row opens on click; the reference is the keyboard route to it */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpen(t)
                      }}
                      aria-label={`Details for ${t.rrn}`}
                      className="rounded-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {t.rrn}
                    </button>
                  </Td>
                  {!hideBankColumn && <Td>{t.bankName}</Td>}
                  <Td>
                    <span className="block tracking-wide">{maskCardNumber(t.cardNumber)}</span>
                    <span className="block text-xs text-muted">
                      {PAYMENT_MODE_LABELS[t.paymentMode]}
                    </span>
                  </Td>
                  <Td>
                    <TransactionStatusBadge status={t.status} />
                  </Td>
                  <Td
                    className={
                      t.status === 'success'
                        ? 'text-right font-semibold'
                        : 'text-right text-muted line-through'
                    }
                  >
                    {formatMoney(t.amount)}
                    {t.currency !== 'NPR' && ` ${t.currency}`}
                  </Td>
                </tr>
              ))
            )}
          </TBody>
          {!loading && (
            <TFoot>
              <tr>
                <Td colSpan={columns - 1}>
                  Page total, {successful} successful of {transactions.length}
                </Td>
                <Td className="text-right">{formatMoney(pageTotal(transactions))}</Td>
              </tr>
            </TFoot>
          )}
        </Table>
      </div>

      {/* Phone: one row per payment */}
      <ul className="divide-y divide-rule md:hidden">
        {loading
          ? null
          : transactions.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onOpen(t)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-accent/60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{t.storeName}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {formatTransactionDate(t.createdAt)}, {t.rrn}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <span className="font-semibold">{formatMoney(t.amount)}</span>
                    <TransactionStatusBadge status={t.status} />
                  </span>
                </button>
              </li>
            ))}
        {!loading && (
          <li className="flex justify-between border-t-2 border-foreground/80 px-4 py-3 text-sm font-semibold">
            <span>Page total (NPR)</span>
            <span>{formatMoney(pageTotal(transactions))}</span>
          </li>
        )}
      </ul>
    </>
  )
}
