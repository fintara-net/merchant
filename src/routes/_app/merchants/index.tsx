import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { SearchInput } from '@/components/ui/search-input'
import { Segmented } from '@/components/ui/segmented'
import { TemporaryPasswordDialog } from '@/components/ui/temporary-password-dialog'
import { toast } from '@/components/ui/toast'
import {
  MerchantForm,
  MerchantsTable,
  merchantsQueryOptions,
  useCreateMerchant,
  useUpdateMerchant,
  type Merchant,
  type MerchantSubmitValues,
} from '@/features/merchants'
import { PERMISSIONS, requirePermission, usePermissions } from '@/features/permissions'
import { formErrorsFrom } from '@/lib/form-errors'

export const Route = createFileRoute('/_app/merchants/')({
  beforeLoad: ({ context }) => requirePermission(context.queryClient, PERMISSIONS.MERCHANTS_READ),
  loader: ({ context }) => context.queryClient.ensureQueryData(merchantsQueryOptions),
  component: MerchantsPage,
})

type DialogState = { mode: 'add' } | { mode: 'edit'; merchant: Merchant } | null
type StatusFilter = 'all' | 'active' | 'inactive'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const

function MerchantsPage() {
  const { data: merchants } = useSuspenseQuery(merchantsQueryOptions)
  const createMerchant = useCreateMerchant()
  const updateMerchant = useUpdateMerchant()
  const { can } = usePermissions()
  const canManage = can(PERMISSIONS.MERCHANTS_MANAGE)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [newLogin, setNewLogin] = useState<{ username: string; password: string } | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const deferredQuery = useDeferredValue(query)
  const close = () => setDialog(null)

  const editing = dialog?.mode === 'edit' ? dialog.merchant : null
  const activeCount = merchants.filter((m) => m.status === 'active').length
  const withLogin = merchants.filter((m) => m.loginUsername).length

  const needle = deferredQuery.trim().toLowerCase()
  const visible = merchants.filter(
    (m) =>
      (status === 'all' || m.status === status) &&
      (!needle ||
        [m.name, m.merchantCode, m.email, m.panNumber, m.loginUsername ?? ''].some((v) =>
          v.toLowerCase().includes(needle),
        )),
  )
  const filtered = needle !== '' || status !== 'all'

  // Duplicates (code, PAN, username, email) are checked by the server and shown per field
  const save = async (values: MerchantSubmitValues) => {
    const { login, ...details } = values
    try {
      if (editing) {
        await updateMerchant.mutateAsync({ id: editing.id, values: details })
        toast.success(`${details.name} updated`)
      } else if (login) {
        const created = await createMerchant.mutateAsync({ ...details, login })
        setNewLogin({ username: created.loginUsername, password: created.temporaryPassword })
      }
      close()
    } catch (error) {
      return formErrorsFrom(error)
    }
  }

  const addButton = canManage && (
    <Button onClick={() => setDialog({ mode: 'add' })}>
      <Plus /> Add merchant
    </Button>
  )

  return (
    <Page
      title="Merchants"
      figures={[
        { label: 'Merchants', value: merchants.length },
        { label: 'Active', value: activeCount },
        { label: 'With a login', value: withLogin },
      ]}
      toolbar={
        merchants.length > 0 && (
          <>
            <SearchInput
              label="Search merchants"
              placeholder="Search name, code, email or login"
              value={query}
              onChange={setQuery}
              className="sm:w-72"
            />
            <Segmented
              label="Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={setStatus}
            />
          </>
        )
      }
      actions={addButton}
      flush
    >
      <MerchantsTable
        merchants={visible}
        canManageLogins={can(PERMISSIONS.USERS_MANAGE)}
        onEdit={canManage ? (merchant) => setDialog({ mode: 'edit', merchant }) : undefined}
        emptyAction={addButton}
        onClearFilters={
          filtered
            ? () => {
                setQuery('')
                setStatus('all')
              }
            : undefined
        }
      />

      <Dialog
        variant="sheet"
        open={dialog !== null}
        onClose={close}
        title={editing ? 'Edit merchant' : 'Add merchant'}
        description={editing ? editing.name : 'Adds the merchant and creates its first login.'}
        className="max-w-xl"
      >
        <MerchantForm
          key={editing?.id ?? 'new'}
          isEdit={!!editing}
          loginUsername={editing?.loginUsername ?? undefined}
          defaultValues={
            editing
              ? { ...editing, login: { username: '', firstName: '', lastName: '' } }
              : undefined
          }
          submitLabel={editing ? 'Save changes' : 'Add merchant'}
          onSubmit={save}
          onCancel={close}
        />
      </Dialog>

      <TemporaryPasswordDialog
        login={newLogin}
        onClose={() => setNewLogin(null)}
        title="Merchant added"
        description="Share this first password with the merchant. It won't be shown again."
      />
    </Page>
  )
}
