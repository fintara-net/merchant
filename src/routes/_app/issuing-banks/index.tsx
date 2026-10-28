import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import {
  IssuingBankForm,
  IssuingBanksTable,
  useIssuingBanks,
  type IssuingBank,
  type IssuingBankFormValues,
} from '@/features/issuing-banks'
import { PERMISSIONS, requirePermission, usePermissions } from '@/features/permissions'

export const Route = createFileRoute('/_app/issuing-banks/')({
  beforeLoad: ({ context }) =>
    requirePermission(context.queryClient, PERMISSIONS.ISSUING_BANKS_READ),
  component: IssuingBanksPage,
})

type DialogState = { mode: 'add' } | { mode: 'edit'; bank: IssuingBank } | null

function IssuingBanksPage() {
  const { banks, addBank, updateBank } = useIssuingBanks()
  const activeCount = banks.filter((bank) => bank.status === 'active').length
  const { can } = usePermissions()
  const canManage = can(PERMISSIONS.ISSUING_BANKS_MANAGE)
  const [dialog, setDialog] = useState<DialogState>(null)
  const close = () => setDialog(null)

  const editing = dialog?.mode === 'edit' ? dialog.bank : null

  const save = (values: IssuingBankFormValues) => {
    const duplicate = banks.some((b) => b.swiftCode === values.swiftCode && b.id !== editing?.id)
    if (duplicate) return 'A bank with this SWIFT code already exists'
    if (editing) updateBank(editing.id, values)
    else addBank(values)
    close()
  }

  const addButton = canManage && (
    <Button onClick={() => setDialog({ mode: 'add' })}>
      <Plus className="size-4" /> Add issuing bank
    </Button>
  )

  return (
    <Page
      title="Issuing banks"
      description={`${banks.length} ${banks.length === 1 ? 'bank' : 'banks'} · ${activeCount} active`}
      actions={addButton}
    >
      <IssuingBanksTable
        banks={banks}
        onEdit={canManage ? (bank) => setDialog({ mode: 'edit', bank }) : undefined}
        emptyAction={addButton}
      />

      <Dialog
        open={dialog !== null}
        onClose={close}
        title={editing ? 'Edit issuing bank' : 'Add issuing bank'}
        description={
          editing ? `Update details for ${editing.name}.` : 'Add a new card-issuing bank.'
        }
      >
        <IssuingBankForm
          key={editing?.id ?? 'new'}
          defaultValues={editing ?? undefined}
          submitLabel={editing ? 'Save changes' : 'Add bank'}
          onSubmit={save}
          onCancel={close}
        />
      </Dialog>
    </Page>
  )
}
