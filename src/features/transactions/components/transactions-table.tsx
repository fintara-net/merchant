import { Eye, ReceiptText, SearchX } from 'lucide-react'
import type { ReactNode } from 'react'
import { Table, TableEmpty, TBody, Td, Th, THead } from '@/components/ui/table'
import { formatAmount, formatTenure, formatTransactionDate, maskCardNumber } from '../format'
import { PAYMENT_MODE_LABELS, type Transaction } from '../schemas'

const COLUMNS = [
  'S.N',
  'Store Name',
  'Store Address',
  'TID',
  'RRN/Ref ID',
  'Bank Name',
  'Card Number',
  'APPR Code',
  'Date & Time',
  'Amount',
  'Tenure',
  'Payment Mode',
  'Action',
] as const

interface TransactionsTableProps {
  transactions: Transaction[]
  /** Row number offset for the current page, e.g. 10 on page 2 with 10 per page */
  startIndex?: number
  onView?: (transaction: Transaction) => void
  onReceipt?: (transaction: Transaction) => void
  /** Hide the Bank Name column, e.g. for bank users who only see their own bank */
  hideBankColumn?: boolean
}

export function TransactionsTable({
  transactions,
  startIndex = 0,
  onView,
  onReceipt,
  hideBankColumn = false,
}: TransactionsTableProps) {
  const columns = hideBankColumn ? COLUMNS.filter((c) => c !== 'Bank Name') : COLUMNS
  const header = (
    <THead>
      <tr>
        {columns.map((c) => (
          <Th
            key={c}
            className={
              c === 'Action'
                ? 'sticky right-0 bg-accent shadow-[-8px_0_8px_-8px_rgb(0_0_0/0.15)]'
                : undefined
            }
          >
            {c}
          </Th>
        ))}
      </tr>
    </THead>
  )

  // Empty state sits below the (scrollable) header so it's always fully visible
  if (transactions.length === 0) {
    return (
      <>
        <Table>{header}</Table>
        <TableEmpty
          icon={<SearchX />}
          title="No transactions found"
          description="Transactions will appear here. Try a different date range or filter."
        />
      </>
    )
  }

  return (
    <Table>
      {header}
      <TBody>
        {transactions.map((t, i) => (
          <tr key={t.id}>
            <Td className="tabular-nums">{startIndex + i + 1}</Td>
            <Td>{t.storeName}</Td>
            <Td>{t.storeAddress}</Td>
            <Td className="tabular-nums">{t.terminalId}</Td>
            <Td className="tabular-nums">{t.rrn}</Td>
            {!hideBankColumn && <Td>{t.bankName}</Td>}
            <Td className="tabular-nums">{maskCardNumber(t.cardNumber)}</Td>
            <Td>{t.approvalCode}</Td>
            <Td className="tabular-nums">{formatTransactionDate(t.createdAt)}</Td>
            <Td className="font-semibold text-foreground tabular-nums">
              {formatAmount(t.amount, t.currency)}
            </Td>
            <Td>{formatTenure(t.tenureMonths)}</Td>
            <Td>{PAYMENT_MODE_LABELS[t.paymentMode]}</Td>
            <Td className="sticky right-0 bg-surface py-2.5 shadow-[-8px_0_8px_-8px_rgb(0_0_0/0.15)]">
              <div className="flex gap-1.5">
                {onView && (
                  <IconAction label={`View ${t.rrn}`} onClick={() => onView(t)}>
                    <Eye className="size-4" />
                  </IconAction>
                )}
                {onReceipt && (
                  <IconAction label={`Receipt for ${t.rrn}`} onClick={() => onReceipt(t)}>
                    <ReceiptText className="size-4" />
                  </IconAction>
                )}
              </div>
            </Td>
          </tr>
        ))}
      </TBody>
    </Table>
  )
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label.split(' ')[0]}
      className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary transition-colors hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-primary"
    >
      {children}
    </button>
  )
}
