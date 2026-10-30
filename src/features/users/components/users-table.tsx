import { Ban, CircleCheck, KeyRound, Lock, LockOpen, SquarePen, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableEmpty, TBody, Td, Th, THead } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useOrganisationName } from '../organisation'
import { fullName, USER_TYPE_LABELS, type ManagedUser } from '../schemas'
import { UserStatusBadge } from './user-status-badge'

/** Tighter cell padding so all 10 columns fit on a laptop screen */
const DENSE = 'text-[13px] [&_td]:px-2 [&_th]:px-2'

export interface UserActions {
  onEdit: (user: ManagedUser) => void
  onToggleLock: (user: ManagedUser) => void
  onToggleStatus: (user: ManagedUser) => void
  onResetPassword: (user: ManagedUser) => void
}

interface UsersTableProps {
  users: ManagedUser[]
  startIndex?: number
  selected: ReadonlySet<string>
  onSelectedChange: (selected: Set<string>) => void
  /** Omit to hide the Action column (user can't manage users) */
  actions?: UserActions
  emptyAction?: ReactNode
}

export function UsersTable({
  users,
  startIndex = 0,
  selected,
  onSelectedChange,
  actions,
  emptyAction,
}: UsersTableProps) {
  const organisationName = useOrganisationName()
  const selectedOnPage = users.filter((u) => selected.has(u.id)).length
  const allSelected = users.length > 0 && selectedOnPage === users.length

  const toggleAll = () => {
    const next = new Set(selected)
    for (const u of users) {
      if (allSelected) next.delete(u.id)
      else next.add(u.id)
    }
    onSelectedChange(next)
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectedChange(next)
  }

  const header = (
    <THead>
      <tr>
        <Th className="w-9">
          <Checkbox
            aria-label="Select all users on this page"
            checked={allSelected}
            indeterminate={selectedOnPage > 0 && !allSelected}
            disabled={users.length === 0}
            onChange={toggleAll}
          />
        </Th>
        <Th className="w-10">S.N</Th>
        <Th>Username</Th>
        <Th>Fullname</Th>
        <Th>Phone Number</Th>
        <Th>Email ID</Th>
        <Th>User Type</Th>
        <Th>Organisation</Th>
        <Th>Status</Th>
        {actions && (
          <Th className="sticky right-0 bg-accent shadow-[-8px_0_8px_-8px_rgb(0_0_0/0.15)]">
            Action
          </Th>
        )}
      </tr>
    </THead>
  )

  if (users.length === 0) {
    return (
      <>
        <Table className={DENSE}>{header}</Table>
        <TableEmpty
          icon={<Users />}
          title="No users yet"
          description="Users you add will appear here."
          action={emptyAction}
        />
      </>
    )
  }

  return (
    <Table className={DENSE}>
      {header}
      <TBody>
        {users.map((u, i) => (
          <tr key={u.id} className={cn(selected.has(u.id) && 'bg-primary/5')}>
            <Td>
              <Checkbox
                aria-label={`Select ${u.username}`}
                checked={selected.has(u.id)}
                onChange={() => toggleOne(u.id)}
              />
            </Td>
            <Td className="tabular-nums">{startIndex + i + 1}</Td>
            <Td>{u.username}</Td>
            <Td className="max-w-40 truncate" title={fullName(u)}>
              {fullName(u)}
            </Td>
            <Td className="tabular-nums">{u.phoneNumber}</Td>
            <Td className="max-w-36 truncate" title={u.email}>
              {u.email}
            </Td>
            <Td>{USER_TYPE_LABELS[u.userType]}</Td>
            <Td className="max-w-36 truncate" title={organisationName(u)}>
              {organisationName(u)}
            </Td>
            <Td>
              <UserStatusBadge user={u} />
            </Td>
            {actions && (
              <Td className="sticky right-0 bg-surface py-2.5 shadow-[-8px_0_8px_-8px_rgb(0_0_0/0.15)]">
                <div className="flex gap-1">
                  <IconAction label={`Edit ${u.username}`} onClick={() => actions.onEdit(u)}>
                    <SquarePen />
                  </IconAction>
                  <IconAction
                    label={`${u.locked ? 'Unlock' : 'Lock'} ${u.username}`}
                    onClick={() => actions.onToggleLock(u)}
                  >
                    {u.locked ? <LockOpen /> : <Lock />}
                  </IconAction>
                  <IconAction
                    label={`${u.status === 'active' ? 'Deactivate' : 'Activate'} ${u.username}`}
                    tone={u.status === 'active' ? 'danger' : 'success'}
                    onClick={() => actions.onToggleStatus(u)}
                  >
                    {u.status === 'active' ? <Ban /> : <CircleCheck />}
                  </IconAction>
                  <IconAction
                    label={`Reset password for ${u.username}`}
                    onClick={() => actions.onResetPassword(u)}
                  >
                    <KeyRound />
                  </IconAction>
                </div>
              </Td>
            )}
          </tr>
        ))}
      </TBody>
    </Table>
  )
}

function IconAction({
  label,
  tone = 'primary',
  onClick,
  children,
}: {
  label: string
  tone?: 'primary' | 'danger' | 'success'
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      // Tooltip: just the action word, e.g. "Lock"
      title={label.replace(/ (for )?\S+$/, '')}
      className={cn(
        'grid size-7 place-items-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-primary [&>svg]:size-3.5',
        tone === 'primary' && 'bg-primary/10 text-primary hover:bg-primary/20',
        tone === 'danger' && 'bg-danger/10 text-danger hover:bg-danger/20',
        tone === 'success' && 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20',
      )}
    >
      {children}
    </button>
  )
}
