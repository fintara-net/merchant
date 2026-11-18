import { Building2, SearchX, SquarePen } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { RowMenu } from '@/components/ui/row-menu'
import { SortableTh, useSort } from '@/components/ui/sortable-th'
import { EmptyState, Table, TBody, Td, Th, THead } from '@/components/ui/table'
import type { IssuingBank } from '../schemas'
import { IssuingBankStatusBadge } from './status-badge'

type SortKey = 'name' | 'swiftCode' | 'status'

interface IssuingBanksTableProps {
  banks: IssuingBank[]
  /** Omit to hide the actions column (e.g. user can't manage banks) */
  onEdit?: (bank: IssuingBank) => void
  /** Shown when there are no banks at all */
  emptyAction?: ReactNode
  /** Set when a search or filter hides every bank */
  onClearFilters?: () => void
}

export function IssuingBanksTable({
  banks,
  onEdit,
  emptyAction,
  onClearFilters,
}: IssuingBanksTableProps) {
  const { sorted, sort, toggle } = useSort<IssuingBank, SortKey>(
    banks,
    { key: 'name', direction: 'asc' },
    (bank, key) => bank[key],
  )

  if (banks.length === 0) {
    return onClearFilters ? (
      <EmptyState
        icon={<SearchX />}
        title="No banks match your search"
        description="Try a different name or SWIFT code, or clear the filters."
        action={
          <Button variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={<Building2 />}
        title="No issuing banks yet"
        description="Add the card-issuing banks that work with Fintara. Each bank's staff can then be given access."
        action={emptyAction}
      />
    )
  }

  const menu = (bank: IssuingBank) =>
    onEdit && (
      <RowMenu
        label={`Actions for ${bank.name}`}
        items={[{ label: 'Edit details', icon: SquarePen, onSelect: () => onEdit(bank) }]}
      />
    )

  return (
    <>
      {/* Tablet & desktop: table */}
      <div className="hidden md:block">
        <Table>
          <THead>
            <tr>
              <SortableTh column="name" sort={sort} onSort={toggle}>
                Bank
              </SortableTh>
              <SortableTh column="swiftCode" sort={sort} onSort={toggle}>
                SWIFT code
              </SortableTh>
              <SortableTh column="status" sort={sort} onSort={toggle}>
                Status
              </SortableTh>
              {onEdit && (
                <Th className="w-14">
                  <span className="sr-only">Actions</span>
                </Th>
              )}
            </tr>
          </THead>
          <TBody>
            {sorted.map((bank) => (
              <tr key={bank.id}>
                <Td className="font-medium">{bank.name}</Td>
                <Td className="tracking-wide">{bank.swiftCode}</Td>
                <Td>
                  <IssuingBankStatusBadge status={bank.status} />
                </Td>
                {onEdit && <Td className="py-1.5 text-right">{menu(bank)}</Td>}
              </tr>
            ))}
          </TBody>
        </Table>
      </div>

      {/* Phone: one row per bank */}
      <ul className="divide-y divide-rule md:hidden">
        {sorted.map((bank) => (
          <li key={bank.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{bank.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs tracking-wide text-muted">{bank.swiftCode}</span>
                <IssuingBankStatusBadge status={bank.status} />
              </div>
            </div>
            {menu(bank)}
          </li>
        ))}
      </ul>
    </>
  )
}
