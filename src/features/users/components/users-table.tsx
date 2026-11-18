import {
  Ban,
  CircleCheck,
  KeyRound,
  Lock,
  LockOpen,
  SearchX,
  ShieldOff,
  SquarePen,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RowMenu, type RowMenuItem } from '@/components/ui/row-menu'
import { Skeleton, SkeletonRows } from '@/components/ui/skeleton'
import { EmptyState, Table, TBody, Td, Th, THead } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useOrganisationName } from '../organisation'
import { fullName, USER_TYPE_LABELS, type ManagedUser } from '../schemas'
import { UserStatusBadge } from './user-status-badge'

export interface UserActions {
  onEdit: (user: ManagedUser) => void
  onToggleLock: (user: ManagedUser) => void
  onToggleStatus: (user: ManagedUser) => void
  onResetPassword: (user: ManagedUser) => void
  onResetTwoFactor: (user: ManagedUser) => void
}

interface UsersTableProps {
  users: ManagedUser[]
  loading?: boolean
  selected: ReadonlySet<string>
  onSelectedChange: (selected: Set<string>) => void
  /** Omit to hide the actions column (user can't manage users) */
  actions?: UserActions
  emptyAction?: ReactNode
  /** Set when a filter hides every user */
  onClearFilters?: () => void
}

const COLUMNS = 8

export function UsersTable({
  users,
  loading = false,
  selected,
  onSelectedChange,
  actions,
  emptyAction,
  onClearFilters,
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

  if (!loading && users.length === 0) {
    return onClearFilters ? (
      <EmptyState
        icon={<SearchX />}
        title="No users match these filters"
        description="Try another user type, or show all users."
        action={
          <Button variant="outline" onClick={onClearFilters}>
            Show all users
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={<Users />}
        title="No users yet"
        description="Add the people who need the dashboard. Each gets a temporary password and sets up two-factor sign-in the first time."
        action={emptyAction}
      />
    )
  }

  // The main super admin can't be locked, deactivated or reset here (2FA is reset on the server)
  const menuItems = (u: ManagedUser): RowMenuItem[] => {
    if (!actions) return []
    const items: RowMenuItem[] = [
      { label: 'Edit details', icon: SquarePen, onSelect: () => actions.onEdit(u) },
    ]
    if (u.isProtected) return items
    items.push(
      {
        label: 'Reset password',
        icon: KeyRound,
        onSelect: () => actions.onResetPassword(u),
        separated: true,
      },
      // Nothing to reset until they've set up an authenticator
      ...(u.twoFactorEnabled
        ? [
            {
              label: 'Reset two-factor sign-in',
              icon: ShieldOff,
              onSelect: () => actions.onResetTwoFactor(u),
            },
          ]
        : []),
      {
        label: u.locked ? 'Unlock' : 'Lock',
        icon: u.locked ? LockOpen : Lock,
        onSelect: () => actions.onToggleLock(u),
        tone: u.locked ? undefined : 'danger',
        separated: true,
      },
      {
        label: u.status === 'active' ? 'Deactivate' : 'Activate',
        icon: u.status === 'active' ? Ban : CircleCheck,
        onSelect: () => actions.onToggleStatus(u),
        tone: u.status === 'active' ? 'danger' : undefined,
      },
    )
    return items
  }

  return (
    <>
      {/* Phone: one row per user */}
      <ul className="divide-y divide-rule md:hidden">
        {loading
          ? [1, 2, 3].map((i) => (
              <li key={i} className="flex flex-col gap-2 px-4 py-3">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-56" />
              </li>
            ))
          : users.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{fullName(u)}</p>
                  <p className="truncate text-xs text-muted">
                    {u.username}, {USER_TYPE_LABELS[u.userType]}, {organisationName(u)}
                  </p>
                  <div className="mt-1">
                    <UserStatusBadge user={u} />
                  </div>
                </div>
                {actions && <RowMenu label={`Actions for ${u.username}`} items={menuItems(u)} />}
              </li>
            ))}
      </ul>

      {/* Tablet & desktop: table */}
      <div className="hidden md:block">
        <Table>
          <THead>
            <tr>
              <Th className="w-10">
                <Checkbox
                  aria-label="Select all users on this page"
                  checked={allSelected}
                  indeterminate={selectedOnPage > 0 && !allSelected}
                  disabled={users.length === 0}
                  onChange={toggleAll}
                />
              </Th>
              <Th>Name</Th>
              <Th>Username</Th>
              <Th>Contact</Th>
              <Th>Type</Th>
              <Th>Organisation</Th>
              <Th>Status</Th>
              {actions && (
                <Th className="w-14">
                  <span className="sr-only">Actions</span>
                </Th>
              )}
            </tr>
          </THead>
          <TBody>
            {loading ? (
              <SkeletonRows rows={6} columns={actions ? COLUMNS : COLUMNS - 1} />
            ) : (
              users.map((u) => (
                <tr key={u.id} className={cn(selected.has(u.id) && 'bg-primary-soft')}>
                  <Td>
                    <Checkbox
                      aria-label={`Select ${u.username}`}
                      checked={selected.has(u.id)}
                      onChange={() => toggleOne(u.id)}
                    />
                  </Td>
                  <Td className="max-w-44 truncate font-medium" title={fullName(u)}>
                    {fullName(u)}
                  </Td>
                  <Td>{u.username}</Td>
                  <Td className="max-w-56">
                    <span className="block truncate" title={u.email}>
                      {u.email}
                    </span>
                    <span className="block text-xs text-muted">{u.phoneNumber}</span>
                  </Td>
                  <Td>{USER_TYPE_LABELS[u.userType]}</Td>
                  <Td className="max-w-44 truncate" title={organisationName(u)}>
                    {organisationName(u)}
                  </Td>
                  <Td>
                    <UserStatusBadge user={u} />
                  </Td>
                  {actions && (
                    <Td className="py-1.5 text-right">
                      <RowMenu label={`Actions for ${u.username}`} items={menuItems(u)} />
                    </Td>
                  )}
                </tr>
              ))
            )}
          </TBody>
        </Table>
      </div>
    </>
  )
}
