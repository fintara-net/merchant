import { Building2, SquarePen } from 'lucide-react'
import type { ReactNode } from 'react'
import { Table, TBody, Td, Th, THead } from '@/components/ui/table'
import type { IssuingBank } from '../schemas'
import { IssuingBankStatusBadge } from './status-badge'

interface IssuingBanksTableProps {
  banks: IssuingBank[]
  /** Omit to hide the Action column (e.g. user can't manage banks) */
  onEdit?: (bank: IssuingBank) => void
  /** Shown when there are no banks */
  emptyAction?: ReactNode
}

export function IssuingBanksTable({ banks, onEdit, emptyAction }: IssuingBanksTableProps) {
  if (banks.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Building2 className="size-6" />
        </span>
        <p className="mt-4 font-semibold">No issuing banks yet</p>
        <p className="mt-1 text-sm text-muted">Banks you add will show up here.</p>
        {emptyAction && <div className="mt-5">{emptyAction}</div>}
      </div>
    )
  }

  const editButton = (bank: IssuingBank) =>
    onEdit && (
      <button
        type="button"
        onClick={() => onEdit(bank)}
        aria-label={`Edit ${bank.name}`}
        title="Edit"
        className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary transition-colors hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <SquarePen className="size-4" />
      </button>
    )

  return (
    <>
      {/* Tablet & desktop: table */}
      <div className="hidden md:block">
        <Table>
          <THead>
            <tr>
              <Th className="w-16">S.N</Th>
              <Th>Bank Name</Th>
              <Th>Swift Code</Th>
              <Th>Status</Th>
              {onEdit && <Th className="w-24">Action</Th>}
            </tr>
          </THead>
          <TBody>
            {banks.map((bank, i) => (
              <tr key={bank.id}>
                <Td className="tabular-nums">{i + 1}</Td>
                <Td>{bank.name}</Td>
                <Td>{bank.swiftCode}</Td>
                <Td>
                  <IssuingBankStatusBadge status={bank.status} />
                </Td>
                {onEdit && <Td className="py-2.5">{editButton(bank)}</Td>}
              </tr>
            ))}
          </TBody>
        </Table>
      </div>

      {/* Mobile: stacked cards */}
      <ul className="flex flex-col divide-y border-y md:hidden">
        {banks.map((bank, i) => (
          <li key={bank.id} className="flex items-center gap-3 px-1 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">
                <span className="mr-1.5 font-normal text-muted tabular-nums">{i + 1}.</span>
                {bank.name}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">{bank.swiftCode}</span>
                <IssuingBankStatusBadge status={bank.status} />
              </div>
            </div>
            {editButton(bank)}
          </li>
        ))}
      </ul>
    </>
  )
}
