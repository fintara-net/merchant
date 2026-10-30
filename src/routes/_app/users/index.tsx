import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog } from '@/components/ui/dialog'
import { Label } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Select } from '@/components/ui/select'
import { PERMISSIONS, requirePermission, usePermissions } from '@/features/permissions'
import {
  UserForm,
  UsersTable,
  USER_TYPE_LABELS,
  USER_TYPES,
  usersSearchSchema,
  useUsers,
  type ManagedUser,
  type UserFormValues,
  type UserType,
} from '@/features/users'

export const Route = createFileRoute('/_app/users/')({
  validateSearch: usersSearchSchema,
  beforeLoad: ({ context }) => requirePermission(context.queryClient, PERMISSIONS.USERS_READ),
  component: UsersPage,
})

type ConfirmAction = 'lock' | 'unlock' | 'deactivate' | 'activate' | 'reset-password'

type DialogState =
  | { mode: 'add' }
  | { mode: 'edit'; user: ManagedUser }
  | { mode: 'confirm'; action: ConfirmAction; user: ManagedUser }
  | null

const CONFIRM_TEXT: Record<
  ConfirmAction,
  { title: string; description: (u: string) => string; label: string; tone: 'primary' | 'danger' }
> = {
  lock: {
    title: 'Lock user?',
    description: (u) => `${u} won't be able to sign in until the account is unlocked.`,
    label: 'Lock',
    tone: 'danger',
  },
  unlock: {
    title: 'Unlock user?',
    description: (u) => `${u} will be able to sign in again.`,
    label: 'Unlock',
    tone: 'primary',
  },
  deactivate: {
    title: 'Deactivate user?',
    description: (u) => `${u} will be marked inactive and won't be able to sign in.`,
    label: 'Deactivate',
    tone: 'danger',
  },
  activate: {
    title: 'Activate user?',
    description: (u) => `${u} will be marked active and able to sign in.`,
    label: 'Activate',
    tone: 'primary',
  },
  'reset-password': {
    title: 'Reset password?',
    description: (u) => `${u} will need to set a new password the next time they sign in.`,
    label: 'Reset password',
    tone: 'danger',
  },
}

const DEFAULT_PAGE_SIZE = 10

function UsersPage() {
  const { users, addUser, updateUser, setLocked, setStatus } = useUsers()
  const { can } = usePermissions()
  const canManage = can(PERMISSIONS.USERS_MANAGE)
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [dialog, setDialog] = useState<DialogState>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const close = () => setDialog(null)

  const filtered = search.type ? users.filter((u) => u.userType === search.type) : users
  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.min(search.page ?? 1, pageCount)
  const pageUsers = filtered.slice((page - 1) * pageSize, page * pageSize)
  const activeCount = users.filter((u) => u.status === 'active' && !u.locked).length

  const editing = dialog?.mode === 'edit' ? dialog.user : null

  const save = (values: UserFormValues) => {
    const others = users.filter((u) => u.id !== editing?.id)
    const errors: Partial<Record<'username' | 'email', string>> = {}
    if (others.some((u) => u.username.toLowerCase() === values.username.toLowerCase())) {
      errors.username = 'This username is already taken'
    }
    if (others.some((u) => u.email === values.email)) {
      errors.email = 'A user with this email already exists'
    }
    if (errors.username || errors.email) return errors

    // Type and organisation are locked after creation, whatever the form sends
    if (editing)
      updateUser(editing.id, {
        ...values,
        userType: editing.userType,
        bankId: editing.bankId ?? '',
        merchantId: editing.merchantId ?? '',
      })
    else addUser(values)
    close()
  }

  const confirm = () => {
    if (dialog?.mode !== 'confirm') return
    const { action, user } = dialog
    if (action === 'lock' || action === 'unlock') setLocked(user.id, action === 'lock')
    if (action === 'deactivate' || action === 'activate')
      setStatus(user.id, action === 'activate' ? 'active' : 'inactive')
    // TODO: call the reset-password endpoint once the API exists
    close()
  }

  const ask = (action: ConfirmAction, user: ManagedUser) =>
    setDialog({ mode: 'confirm', action, user })

  const newUserButton = canManage && (
    <Button onClick={() => setDialog({ mode: 'add' })}>
      <Plus className="size-4" /> New User
    </Button>
  )

  const confirmText = dialog?.mode === 'confirm' ? CONFIRM_TEXT[dialog.action] : null

  return (
    <Page
      title="User List"
      description={
        users.length > 0
          ? `${users.length} ${users.length === 1 ? 'user' : 'users'} · ${activeCount} active` +
            (selected.size > 0 ? ` · ${selected.size} selected` : '')
          : undefined
      }
      actions={newUserButton}
    >
      {users.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <Label htmlFor="user-type-filter" className="text-sm text-muted">
            User type
          </Label>
          <Select
            id="user-type-filter"
            className="w-44"
            value={search.type ?? ''}
            onChange={(e) =>
              void navigate({
                search: (prev) => ({
                  ...prev,
                  type: (e.target.value || undefined) as UserType | undefined,
                  page: undefined,
                }),
              })
            }
          >
            <option value="">All types</option>
            {USER_TYPES.map((t) => (
              <option key={t} value={t}>
                {USER_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>
      )}

      <UsersTable
        users={pageUsers}
        startIndex={(page - 1) * pageSize}
        selected={selected}
        onSelectedChange={setSelected}
        emptyAction={newUserButton}
        actions={
          canManage
            ? {
                onEdit: (user) => setDialog({ mode: 'edit', user }),
                onToggleLock: (user) => ask(user.locked ? 'unlock' : 'lock', user),
                onToggleStatus: (user) =>
                  ask(user.status === 'active' ? 'deactivate' : 'activate', user),
                onResetPassword: (user) => ask('reset-password', user),
              }
            : undefined
        }
      />

      <div className="mt-5">
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filtered.length}
          onPageChange={(p) => void navigate({ search: (prev) => ({ ...prev, page: p }) })}
          onPageSizeChange={(size) =>
            void navigate({ search: (prev) => ({ ...prev, pageSize: size, page: undefined }) })
          }
        />
      </div>

      <Dialog
        open={dialog?.mode === 'add' || dialog?.mode === 'edit'}
        onClose={close}
        title={editing ? 'Edit user' : 'New user'}
        description={editing ? `Update details for ${editing.username}.` : 'Add a dashboard user.'}
        className="max-w-xl"
      >
        <UserForm
          key={editing?.id ?? 'new'}
          isEdit={!!editing}
          defaultValues={
            editing
              ? {
                  ...editing,
                  middleName: editing.middleName ?? '',
                  bankId: editing.bankId ?? '',
                  merchantId: editing.merchantId ?? '',
                }
              : undefined
          }
          submitLabel={editing ? 'Save changes' : 'Create user'}
          onSubmit={save}
          onCancel={close}
        />
      </Dialog>

      <ConfirmDialog
        open={dialog?.mode === 'confirm'}
        onClose={close}
        onConfirm={confirm}
        title={confirmText?.title ?? ''}
        description={
          dialog?.mode === 'confirm' && confirmText
            ? confirmText.description(dialog.user.username)
            : ''
        }
        confirmLabel={confirmText?.label ?? ''}
        tone={confirmText?.tone}
      />
    </Page>
  )
}
