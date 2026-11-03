import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog } from '@/components/ui/dialog'
import { TemporaryPasswordDialog } from '@/components/ui/temporary-password-dialog'
import { Notice, useNotice } from '@/components/ui/notice'
import { Label } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Select } from '@/components/ui/select'
import { useOrganisationOptions } from '@/features/organisations'
import { PERMISSIONS, requirePermission, usePermissions } from '@/features/permissions'
import {
  UserForm,
  UsersTable,
  USER_TYPE_LABELS,
  USER_TYPES,
  usersQueryOptions,
  usersSearchSchema,
  useCreateUser,
  useResetPassword,
  useUpdateUser,
  useUserCommand,
  type ManagedUser,
  type UserFormValues,
  type UserType,
} from '@/features/users'
import { formErrorsFrom } from '@/lib/form-errors'

export const Route = createFileRoute('/_app/users/')({
  validateSearch: usersSearchSchema,
  beforeLoad: ({ context }) => requirePermission(context.queryClient, PERMISSIONS.USERS_READ),
  component: UsersPage,
})

type ConfirmAction =
  'lock' | 'unlock' | 'deactivate' | 'activate' | 'reset-password' | 'reset-device'

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
    description: (u) =>
      `${u} will be signed out and their current password will stop working. You'll get a new temporary password to give them.`,
    label: 'Reset password',
    tone: 'danger',
  },
  'reset-device': {
    title: 'Reset device?',
    description: (u) =>
      `${u} will be signed out and must register their device again the next time they sign in.`,
    label: 'Reset device',
    tone: 'danger',
  },
}

/** Shown briefly after actions that have no visible effect in the table */
const DONE_TEXT: Partial<Record<ConfirmAction, (u: string) => string>> = {
  'reset-device': (u) => `Device reset for ${u}.`,
}

const DEFAULT_PAGE_SIZE = 10

function UsersPage() {
  const { merchants } = useOrganisationOptions()
  const { can } = usePermissions()
  // Bank and merchant users only read their own organisation's users
  const canManage = can(PERMISSIONS.USERS_MANAGE)
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [dialog, setDialog] = useState<DialogState>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [newLogin, setNewLogin] = useState<{
    username: string
    password: string
    /** true after a password reset, false for a newly created login */
    reset: boolean
  } | null>(null)
  const close = () => setDialog(null)
  const [notice, showNotice] = useNotice()

  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE
  const { data, isPending, isError } = useQuery(
    usersQueryOptions({
      type: search.type,
      merchant: search.merchant,
      page: search.page ?? 1,
      pageSize,
    }),
  )
  const users = data?.items ?? []
  const total = data?.total ?? 0
  const page = data?.page ?? search.page ?? 1
  const activeCount = data?.activeCount ?? 0
  const hasFilters = !!search.type || !!search.merchant

  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const userCommand = useUserCommand()
  const resetPassword = useResetPassword()

  const merchantFilter = search.merchant
    ? merchants.find((m) => m.id === search.merchant)
    : undefined

  const editing = dialog?.mode === 'edit' ? dialog.user : null

  // Duplicate usernames and emails are checked by the server and shown per field.
  // Type and organisation can't change after creation; the server ignores them on edit.
  const save = async (values: UserFormValues) => {
    try {
      if (editing) {
        await updateUser.mutateAsync({ id: editing.id, values })
      } else {
        const created = await createUser.mutateAsync(values)
        setNewLogin({
          username: created.user.username,
          password: created.temporaryPassword,
          reset: false,
        })
      }
      close()
    } catch (error) {
      return formErrorsFrom(error)
    }
  }

  const confirm = async () => {
    if (dialog?.mode !== 'confirm') return
    const { action, user } = dialog
    close()
    try {
      if (
        action === 'lock' ||
        action === 'unlock' ||
        action === 'activate' ||
        action === 'deactivate'
      ) {
        await userCommand.mutateAsync({ id: user.id, command: action })
      } else if (action === 'reset-password') {
        const result = await resetPassword.mutateAsync(user.id)
        setNewLogin({
          username: result.user.username,
          password: result.temporaryPassword,
          reset: true,
        })
      }
      // Reset device stays a placeholder until that endpoint exists
      const done = DONE_TEXT[action]
      if (done) showNotice(done(user.username))
    } catch (error) {
      showNotice(formErrorsFrom(error).root ?? 'That change could not be saved.')
    }
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
        total > 0
          ? `${total} ${total === 1 ? 'user' : 'users'} · ${activeCount} active` +
            (selected.size > 0 ? ` · ${selected.size} selected` : '')
          : undefined
      }
      actions={newUserButton}
    >
      <Notice message={notice} />

      {isError && (
        <p role="alert" className="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">
          Couldn't load users. Please try again.
        </p>
      )}

      {(total > 0 || hasFilters) && (
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
          {search.merchant && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-primary/10 py-1 pr-1 pl-2.5 text-sm text-primary">
              Logins for {merchantFilter?.name ?? 'unknown merchant'}
              <button
                type="button"
                aria-label="Show all users"
                title="Show all users"
                onClick={() =>
                  void navigate({
                    search: (prev) => ({ ...prev, merchant: undefined, page: undefined }),
                  })
                }
                className="grid size-6 place-items-center rounded hover:bg-primary/15"
              >
                <X className="size-3.5" />
              </button>
            </span>
          )}
        </div>
      )}

      <UsersTable
        users={isPending ? [] : users}
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
                onResetDevice: (user) => ask('reset-device', user),
              }
            : undefined
        }
      />

      <div className="mt-5">
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
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
        onConfirm={() => void confirm()}
        title={confirmText?.title ?? ''}
        description={
          dialog?.mode === 'confirm' && confirmText
            ? confirmText.description(dialog.user.username)
            : ''
        }
        confirmLabel={confirmText?.label ?? ''}
        tone={confirmText?.tone}
      />

      <TemporaryPasswordDialog
        login={newLogin}
        onClose={() => setNewLogin(null)}
        {...(newLogin?.reset && {
          title: 'Password reset',
          description: "Share this temporary password with the user. It won't be shown again.",
        })}
      />
    </Page>
  )
}
