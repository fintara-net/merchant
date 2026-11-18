import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { CircleAlert, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog } from '@/components/ui/dialog'
import { TemporaryPasswordDialog } from '@/components/ui/temporary-password-dialog'
import { Pagination } from '@/components/ui/pagination'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/table'
import { toast } from '@/components/ui/toast'
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
  useResetTwoFactor,
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

type ConfirmAction = 'lock' | 'unlock' | 'deactivate' | 'activate' | 'reset-password' | 'reset-2fa'

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
  'reset-2fa': {
    title: 'Reset two-factor sign-in?',
    description: (u) =>
      `Do this if ${u} lost their phone. They'll be signed out, their authenticator app and recovery codes will stop working, and they'll set up a new authenticator the next time they sign in.`,
    label: 'Reset two-factor',
    tone: 'danger',
  },
}

/** Confirmation shown after each action */
const DONE_TEXT: Record<ConfirmAction, (u: string) => string | null> = {
  lock: (u) => `${u} locked`,
  unlock: (u) => `${u} unlocked`,
  deactivate: (u) => `${u} deactivated`,
  activate: (u) => `${u} activated`,
  // The temporary-password box is the confirmation
  'reset-password': () => null,
  'reset-2fa': (u) => `Two-factor sign-in reset for ${u}`,
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

  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE
  const { data, isPending, isError, refetch } = useQuery(
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
  const resetTwoFactor = useResetTwoFactor()

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
        toast.success(`${editing.username} updated`)
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
      } else {
        await resetTwoFactor.mutateAsync(user.id)
      }
      const done = DONE_TEXT[action](user.username)
      if (done) toast.success(done)
    } catch (error) {
      toast.error(formErrorsFrom(error).root ?? "That change couldn't be saved. Try again.")
    }
  }

  const ask = (action: ConfirmAction, user: ManagedUser) =>
    setDialog({ mode: 'confirm', action, user })

  const newUserButton = canManage && (
    <Button onClick={() => setDialog({ mode: 'add' })}>
      <Plus /> New user
    </Button>
  )

  const confirmText = dialog?.mode === 'confirm' ? CONFIRM_TEXT[dialog.action] : null

  const clearFilters = () =>
    void navigate({
      search: (prev) => ({ ...prev, type: undefined, merchant: undefined, page: undefined }),
    })

  return (
    <Page
      title="User management"
      figures={
        data
          ? [
              { label: hasFilters ? 'Users shown' : 'Users', value: total },
              { label: 'Active', value: activeCount },
              ...(selected.size > 0 ? [{ label: 'Selected', value: selected.size }] : []),
            ]
          : undefined
      }
      toolbar={
        (total > 0 || hasFilters) && (
          <>
            <div className="w-full sm:w-48">
              <Select
                aria-label="User type"
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
                <option value="">All user types</option>
                {USER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {USER_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>
            {search.merchant && (
              <span className="inline-flex h-9 items-center gap-1 rounded-md border border-primary-soft-border bg-primary-soft pr-1 pl-3 text-sm text-primary">
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
                  className="grid size-7 place-items-center rounded-sm hover:bg-primary/10"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            )}
          </>
        )
      }
      actions={newUserButton}
      flush
    >
      {isError ? (
        <EmptyState
          icon={<CircleAlert />}
          title="Couldn't load users"
          description="Check your connection, then try again."
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      ) : (
        <>
          <UsersTable
            users={users}
            loading={isPending}
            selected={selected}
            onSelectedChange={setSelected}
            emptyAction={newUserButton}
            onClearFilters={hasFilters ? clearFilters : undefined}
            actions={
              canManage
                ? {
                    onEdit: (user) => setDialog({ mode: 'edit', user }),
                    onToggleLock: (user) => ask(user.locked ? 'unlock' : 'lock', user),
                    onToggleStatus: (user) =>
                      ask(user.status === 'active' ? 'deactivate' : 'activate', user),
                    onResetPassword: (user) => ask('reset-password', user),
                    onResetTwoFactor: (user) => ask('reset-2fa', user),
                  }
                : undefined
            }
          />
          {total > 0 && (
            <div className="border-t border-border px-4 py-3">
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={(p) => void navigate({ search: (prev) => ({ ...prev, page: p }) })}
                onPageSizeChange={(size) =>
                  void navigate({
                    search: (prev) => ({ ...prev, pageSize: size, page: undefined }),
                  })
                }
              />
            </div>
          )}
        </>
      )}

      <Dialog
        variant="sheet"
        open={dialog?.mode === 'add' || dialog?.mode === 'edit'}
        onClose={close}
        title={editing ? 'Edit user' : 'New user'}
        description={
          editing
            ? editing.username
            : 'They get a temporary password and set up two-factor sign-in the first time.'
        }
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
