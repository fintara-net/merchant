import { useNavigate } from '@tanstack/react-router'
import { SearchX, SquarePen, Store, UserCog } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { RowMenu, type RowMenuItem } from '@/components/ui/row-menu'
import { SortableTh, useSort } from '@/components/ui/sortable-th'
import { EmptyState, Table, TBody, Td, Th, THead } from '@/components/ui/table'
import { IssuingBankStatusBadge as StatusBadge } from '@/features/issuing-banks/components/status-badge'
import type { Merchant } from '../schemas'

type SortKey = 'name' | 'merchantCode' | 'status'

interface MerchantsTableProps {
  merchants: Merchant[]
  /** Omit to hide "Edit details" (e.g. user can't manage merchants) */
  onEdit?: (merchant: Merchant) => void
  /** Shown when there are no merchants at all */
  emptyAction?: ReactNode
  /** Show "Manage login" (needs access to the Users page) */
  canManageLogins?: boolean
  /** Set when a search or filter hides every merchant */
  onClearFilters?: () => void
}

export function MerchantsTable({
  merchants,
  onEdit,
  emptyAction,
  canManageLogins = false,
  onClearFilters,
}: MerchantsTableProps) {
  const navigate = useNavigate()
  const { sorted, sort, toggle } = useSort<Merchant, SortKey>(
    merchants,
    { key: 'name', direction: 'asc' },
    (merchant, key) => merchant[key],
  )

  if (merchants.length === 0) {
    return onClearFilters ? (
      <EmptyState
        icon={<SearchX />}
        title="No merchants match your search"
        description="Try a different name, code or email, or clear the filters."
        action={
          <Button variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={<Store />}
        title="No merchants yet"
        description="Adding a merchant also creates its first login, so the merchant can see its own transactions."
        action={emptyAction}
      />
    )
  }

  const menuItems = (merchant: Merchant): RowMenuItem[] => [
    ...(onEdit
      ? [{ label: 'Edit details', icon: SquarePen, onSelect: () => onEdit(merchant) }]
      : []),
    ...(canManageLogins
      ? [
          {
            label: 'Manage login',
            icon: UserCog,
            onSelect: () => void navigate({ to: '/users', search: { merchant: merchant.id } }),
          },
        ]
      : []),
  ]
  const hasActions = !!onEdit || canManageLogins
  const menu = (merchant: Merchant) =>
    hasActions && <RowMenu label={`Actions for ${merchant.name}`} items={menuItems(merchant)} />

  return (
    <>
      {/* Tablet & desktop: table */}
      <div className="hidden md:block">
        <Table>
          <THead>
            <tr>
              <SortableTh column="name" sort={sort} onSort={toggle}>
                Merchant
              </SortableTh>
              <SortableTh column="merchantCode" sort={sort} onSort={toggle}>
                Code
              </SortableTh>
              <Th>PAN/VAT</Th>
              <Th>Contact</Th>
              <Th>Login</Th>
              <SortableTh column="status" sort={sort} onSort={toggle}>
                Status
              </SortableTh>
              {hasActions && (
                <Th className="w-14">
                  <span className="sr-only">Actions</span>
                </Th>
              )}
            </tr>
          </THead>
          <TBody>
            {sorted.map((merchant) => (
              <tr key={merchant.id}>
                <Td className="max-w-56 truncate font-medium" title={merchant.name}>
                  {merchant.name}
                </Td>
                <Td className="font-mono text-sm">{merchant.merchantCode}</Td>
                <Td>{merchant.panNumber}</Td>
                <Td className="max-w-56">
                  <span className="block truncate" title={merchant.email}>
                    {merchant.email}
                  </span>
                  <span className="block text-xs text-muted">{merchant.phoneNumber}</span>
                </Td>
                <Td className="max-w-40 truncate">
                  {merchant.loginUsername ?? <span className="text-muted">No login</span>}
                </Td>
                <Td>
                  <StatusBadge status={merchant.status} />
                </Td>
                {hasActions && <Td className="py-1.5 text-right">{menu(merchant)}</Td>}
              </tr>
            ))}
          </TBody>
        </Table>
      </div>

      {/* Phone: one row per merchant */}
      <ul className="divide-y divide-rule md:hidden">
        {sorted.map((merchant) => (
          <li key={merchant.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{merchant.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted">{merchant.merchantCode}</span>
                <StatusBadge status={merchant.status} />
              </div>
              <p className="mt-1 truncate text-xs text-muted">
                {merchant.loginUsername ?? 'No login'}, {merchant.email}
              </p>
            </div>
            {menu(merchant)}
          </li>
        ))}
      </ul>
    </>
  )
}
