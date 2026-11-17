import { Check, Copy } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { formatMoney, formatTenure, formatTransactionDate, maskCardNumber } from '../format'
import { PAYMENT_MODE_LABELS, type Transaction } from '../schemas'
import { TransactionStatusBadge } from './transactions-table'

/**
 * One transaction laid out like a slip, in a side panel so the list stays where it was.
 * `transaction` null closes it.
 */
export function TransactionDetails({
  transaction,
  onClose,
  showBank = true,
}: {
  transaction: Transaction | null
  onClose: () => void
  showBank?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const t = transaction

  const copyReference = async () => {
    if (!t) return
    try {
      await navigator.clipboard.writeText(t.rrn)
      setCopied(true)
    } catch {
      // Clipboard blocked: the reference is on screen and selectable
    }
  }

  return (
    <Dialog
      variant="sheet"
      open={t !== null}
      onClose={() => {
        setCopied(false)
        onClose()
      }}
      title="Transaction details"
      description={t ? formatTransactionDate(t.createdAt) : undefined}
      footer={
        t && (
          <Button variant="outline" onClick={() => void copyReference()}>
            {copied ? <Check /> : <Copy />}
            {copied ? 'Copied' : 'Copy reference'}
          </Button>
        )
      }
    >
      {t && (
        <div className="flex flex-col gap-6">
          <div className="flex items-end justify-between gap-4 border-b-2 border-foreground/80 pb-4">
            <div>
              <p className="text-sm text-muted">Amount ({t.currency})</p>
              <p
                className={
                  t.status === 'success'
                    ? 'text-2xl font-semibold'
                    : 'text-2xl font-semibold text-muted line-through'
                }
              >
                {formatMoney(t.amount)}
              </p>
            </div>
            <TransactionStatusBadge status={t.status} />
          </div>

          <Section title="Where">
            <Row label="Store">{t.storeName}</Row>
            <Row label="Address">{t.storeAddress}</Row>
            <Row label="Terminal ID">{t.terminalId}</Row>
          </Section>

          <Section title="Payment">
            <Row label="RRN / reference">
              <span className="select-all">{t.rrn}</span>
            </Row>
            <Row label="Approval code">{t.approvalCode}</Row>
            <Row label="Card">
              <span className="tracking-wide">{maskCardNumber(t.cardNumber)}</span>
            </Row>
            {showBank && <Row label="Issuing bank">{t.bankName}</Row>}
            <Row label="Payment mode">{PAYMENT_MODE_LABELS[t.paymentMode]}</Row>
            <Row label="Tenure">{formatTenure(t.tenureMonths)}</Row>
          </Section>
        </div>
      )}
    </Dialog>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      <dl className="divide-y divide-rule">{children}</dl>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 py-2 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  )
}
