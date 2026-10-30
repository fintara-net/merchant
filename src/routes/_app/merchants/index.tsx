import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import {
  MerchantForm,
  MerchantsTable,
  useMerchants,
  type Merchant,
  type MerchantFormErrorField,
  type MerchantSubmitValues,
} from '@/features/merchants'
import { PERMISSIONS, requirePermission, usePermissions } from '@/features/permissions'
import { useUsers } from '@/features/users'

export const Route = createFileRoute('/_app/merchants/')({
  beforeLoad: ({ context }) => requirePermission(context.queryClient, PERMISSIONS.MERCHANTS_READ),
  component: MerchantsPage,
})

type DialogState = { mode: 'add' } | { mode: 'edit'; merchant: Merchant } | null

function MerchantsPage() {
  const { merchants, addMerchant, updateMerchant } = useMerchants()
  const { users, addUser } = useUsers()
  const activeCount = merchants.filter((m) => m.status === 'active').length
  const { can } = usePermissions()
  const canManage = can(PERMISSIONS.MERCHANTS_MANAGE)
  const [dialog, setDialog] = useState<DialogState>(null)
  const close = () => setDialog(null)

  // One login per merchant for now; if there are ever several, show the first
  const logins = new Map<string, string>()
  for (const u of users) {
    if (u.merchantId && !logins.has(u.merchantId)) logins.set(u.merchantId, u.username)
  }

  const editing = dialog?.mode === 'edit' ? dialog.merchant : null

  const save = (values: MerchantSubmitValues) => {
    const others = merchants.filter((m) => m.id !== editing?.id)
    const errors: Partial<Record<MerchantFormErrorField, string>> = {}
    if (others.some((m) => m.merchantCode === values.merchantCode))
      errors.merchantCode = 'A merchant with this code already exists'
    if (others.some((m) => m.panNumber === values.panNumber))
      errors.panNumber = 'A merchant with this PAN number already exists'

    // The new login uses the merchant's email, so it must be free among users too
    const { login, ...details } = values
    if (!editing && login) {
      if (users.some((u) => u.username.toLowerCase() === login.username.toLowerCase()))
        errors['login.username'] = 'This username is already taken'
      if (users.some((u) => u.email === values.email))
        errors.email = 'A user with this email already exists'
    }
    if (Object.keys(errors).length > 0) return errors

    if (editing) {
      updateMerchant(editing.id, details)
    } else if (login) {
      const merchantId = addMerchant(details)
      addUser({
        ...login,
        middleName: '',
        phoneNumber: values.phoneNumber,
        email: values.email,
        userType: 'merchant',
        bankId: '',
        merchantId,
        status: 'active',
      })
    }
    close()
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
    </Page>
  )
}
