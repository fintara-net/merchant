import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { TemporaryPasswordDialog } from '@/components/ui/temporary-password-dialog'
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

function MerchantsPage() {
  const { data: merchants } = useSuspenseQuery(merchantsQueryOptions)
  const createMerchant = useCreateMerchant()
  const updateMerchant = useUpdateMerchant()
  const activeCount = merchants.filter((m) => m.status === 'active').length
  const { can } = usePermissions()
  const canManage = can(PERMISSIONS.MERCHANTS_MANAGE)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [newLogin, setNewLogin] = useState<{ username: string; password: string } | null>(null)
  const close = () => setDialog(null)

  const logins = new Map<string, string>()
  for (const m of merchants) {
    if (m.loginUsername) logins.set(m.id, m.loginUsername)
  }

  const editing = dialog?.mode === 'edit' ? dialog.merchant : null

  // Duplicates (code, PAN, username, email) are checked by the server and shown per field
  const save = async (values: MerchantSubmitValues) => {
    const { login, ...details } = values
    try {
      if (editing) {
        await updateMerchant.mutateAsync({ id: editing.id, values: details })
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
      <Plus className="size-4" /> Add merchant
    </Button>
  )

  return (
    <Page
      title="Merchants"
      description={`${merchants.length} ${merchants.length === 1 ? 'merchant' : 'merchants'} · ${activeCount} active`}
      actions={addButton}
    >
      <MerchantsTable
        merchants={merchants}
        logins={logins}
        canManageLogins={can(PERMISSIONS.USERS_MANAGE)}
        onEdit={canManage ? (merchant) => setDialog({ mode: 'edit', merchant }) : undefined}
        emptyAction={addButton}
      />

      <Dialog
        open={dialog !== null}
        onClose={close}
        title={editing ? 'Edit merchant' : 'Add merchant'}
        description={
          editing ? `Update details for ${editing.name}.` : 'Add a merchant and create its login.'
        }
        className="max-w-xl"
      >
        <MerchantForm
          key={editing?.id ?? 'new'}
          isEdit={!!editing}
          loginUsername={editing ? logins.get(editing.id) : undefined}
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

      <TemporaryPasswordDialog login={newLogin} onClose={() => setNewLogin(null)} />
    </Page>
  )
}
