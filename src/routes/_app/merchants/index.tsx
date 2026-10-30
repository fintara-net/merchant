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
  type MerchantFormValues,
} from '@/features/merchants'
import { PERMISSIONS, requirePermission, usePermissions } from '@/features/permissions'

export const Route = createFileRoute('/_app/merchants/')({
  beforeLoad: ({ context }) => requirePermission(context.queryClient, PERMISSIONS.MERCHANTS_READ),
  component: MerchantsPage,
})

type DialogState = { mode: 'add' } | { mode: 'edit'; merchant: Merchant } | null

function MerchantsPage() {
  const { merchants, addMerchant, updateMerchant } = useMerchants()
  const activeCount = merchants.filter((m) => m.status === 'active').length
  const { can } = usePermissions()
  const canManage = can(PERMISSIONS.MERCHANTS_MANAGE)
  const [dialog, setDialog] = useState<DialogState>(null)
  const close = () => setDialog(null)

  const editing = dialog?.mode === 'edit' ? dialog.merchant : null

  const save = (values: MerchantFormValues) => {
    const others = merchants.filter((m) => m.id !== editing?.id)
    const errors: Partial<Record<'merchantCode' | 'panNumber', string>> = {}
    if (others.some((m) => m.merchantCode === values.merchantCode))
      errors.merchantCode = 'A merchant with this code already exists'
    if (others.some((m) => m.panNumber === values.panNumber))
      errors.panNumber = 'A merchant with this PAN number already exists'
    if (Object.keys(errors).length > 0) return errors

    if (editing) updateMerchant(editing.id, values)
    else addMerchant(values)
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
        onEdit={canManage ? (merchant) => setDialog({ mode: 'edit', merchant }) : undefined}
        emptyAction={addButton}
      />

      <Dialog
        open={dialog !== null}
        onClose={close}
        title={editing ? 'Edit merchant' : 'Add merchant'}
        description={editing ? `Update details for ${editing.name}.` : 'Add a new merchant.'}
      >
        <MerchantForm
          key={editing?.id ?? 'new'}
          defaultValues={editing ?? undefined}
          submitLabel={editing ? 'Save changes' : 'Add merchant'}
          onSubmit={save}
          onCancel={close}
        />
      </Dialog>
    </Page>
  )
}
