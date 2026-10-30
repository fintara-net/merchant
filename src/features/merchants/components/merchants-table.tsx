import { Link } from '@tanstack/react-router'
import { SquarePen, Store, UserCog } from 'lucide-react'
import type { ReactNode } from 'react'
import { Table, TBody, Td, Th, THead } from '@/components/ui/table'
import { IssuingBankStatusBadge as StatusBadge } from '@/features/issuing-banks/components/status-badge'
import type { Merchant } from '../schemas'

/** Tighter cell padding so all 9 columns fit on a laptop screen (same as the users table) */
const DENSE = 'text-[13px] [&_td]:px-2 [&_th]:px-2'

const ICON_BUTTON =
  'grid size-8 place-items-center rounded-md bg-primary/10 text-primary transition-colors hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-primary'

interface MerchantsTableProps {
  merchants: Merchant[]
  /** Omit to hide the Action column (e.g. user can't manage merchants) */
  onEdit?: (merchant: Merchant) => void
  /** Shown when there are no merchants */
  emptyAction?: ReactNode
  /** Username of each merchant's login, keyed by merchant id */
  logins: ReadonlyMap<string, string>
  /** Show the "Manage login" link (needs access to the Users page) */
  canManageLogins?: boolean
}

export function MerchantsTable({
  merchants,
  onEdit,
  emptyAction,
  logins,
  canManageLogins = false,
}: MerchantsTableProps) {
  if (merchants.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Store className="size-6" />
        </span>
        <p className="mt-4 font-semibold">No merchants yet</p>
        <p className="mt-1 text-sm text-muted">Merchants you add will show up here.</p>
        {emptyAction && <div className="mt-5">{emptyAction}</div>}
      </div>
    )
  }

  const hasActions = !!onEdit || canManageLogins

  const actionButtons = (merchant: Merchant) =>
    hasActions && (
      <div className="flex gap-1">
        {editButton(merchant)}
        {canManageLogins && (
          <Link
            to="/users"
            search={{ merchant: merchant.id }}
            aria-label={`Manage login for ${merchant.name}`}
            title="Manage login"
            className={ICON_BUTTON}
          >
            <UserCog className="size-4" />
          </Link>
        )}
      </div>
    )

  const editButton = (merchant: Merchant) =>
    onEdit && (
      <button
        type="button"
        onClick={() => onEdit(merchant)}
        aria-label={`Edit ${merchant.name}`}
        title="Edit"
        className={ICON_BUTTON}
      >
        <SquarePen className="size-4" />
      </button>
    )

  return (
    <>
      {/* Tablet & desktop: table */}
      <div className="hidden md:block">
        <Table className={DENSE}>
          <THead>
            <tr>
              <Th className="w-16">S.N</Th>
              <Th>Merchant Name</Th>
              <Th>Merchant Code</Th>
              <Th>PAN/VAT</Th>
              <Th>Phone</Th>
              <Th>Email</Th>
              <Th>Login</Th>
              <Th>Status</Th>
              {hasActions && <Th className="w-24">Action</Th>}
            </tr>
          </THead>
          <TBody>
            {merchants.map((merchant, i) => (
              <tr key={merchant.id}>
                <Td className="tabular-nums">{i + 1}</Td>
                <Td className="max-w-48 truncate" title={merchant.name}>
                  {merchant.name}
                </Td>
                <Td>{merchant.merchantCode}</Td>
                <Td className="tabular-nums">{merchant.panNumber}</Td>
                <Td className="tabular-nums">{merchant.phoneNumber}</Td>
                <Td className="max-w-40 truncate" title={merchant.email}>
                  {merchant.email}
                </Td>
                <Td className="max-w-36 truncate" title={logins.get(merchant.id)}>
                  {logins.get(merchant.id) ?? '—'}
                </Td>
                <Td>
                  <StatusBadge status={merchant.status} />
                </Td>
                {hasActions && <Td className="py-2.5">{actionButtons(merchant)}</Td>}
              </tr>
            ))}
          </TBody>
        </Table>
      </div>

      {/* Mobile: stacked cards */}
      <ul className="flex flex-col divide-y border-y md:hidden">
        {merchants.map((merchant, i) => (
          <li key={merchant.id} className="flex items-center gap-3 px-1 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">
                <span className="mr-1.5 font-normal text-muted tabular-nums">{i + 1}.</span>
                {merchant.name}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">{merchant.merchantCode}</span>
                <StatusBadge status={merchant.status} />
              </div>
              <p className="mt-1 truncate text-xs text-muted">
                {logins.get(merchant.id) ?? 'No login'} · {merchant.email}
              </p>
            </div>
            {actionButtons(merchant)}
          </li>
        ))}
      </ul>
    </>
  )
}
