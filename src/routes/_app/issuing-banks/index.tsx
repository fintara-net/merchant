import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { SearchInput } from '@/components/ui/search-input'
import { Segmented } from '@/components/ui/segmented'
import { toast } from '@/components/ui/toast'
import {
  IssuingBankForm,
  IssuingBanksTable,
  issuingBanksQueryOptions,
  useSaveIssuingBank,
  type IssuingBank,
  type IssuingBankFormValues,
} from '@/features/issuing-banks'
import { PERMISSIONS, requirePermission, usePermissions } from '@/features/permissions'
import { formErrorsFrom } from '@/lib/form-errors'

export const Route = createFileRoute('/_app/issuing-banks/')({
  beforeLoad: ({ context }) =>
    requirePermission(context.queryClient, PERMISSIONS.ISSUING_BANKS_READ),
  loader: ({ context }) => context.queryClient.ensureQueryData(issuingBanksQueryOptions),
  component: IssuingBanksPage,
})

type DialogState = { mode: 'add' } | { mode: 'edit'; bank: IssuingBank } | null
type StatusFilter = 'all' | 'active' | 'inactive'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const

function IssuingBanksPage() {
  const { data: banks } = useSuspenseQuery(issuingBanksQueryOptions)
  const saveBank = useSaveIssuingBank()
  const { can } = usePermissions()
  const canManage = can(PERMISSIONS.ISSUING_BANKS_MANAGE)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const deferredQuery = useDeferredValue(query)
  const close = () => setDialog(null)

  const editing = dialog?.mode === 'edit' ? dialog.bank : null
  const activeCount = banks.filter((bank) => bank.status === 'active').length

  const needle = deferredQuery.trim().toLowerCase()
  const visible = banks.filter(
    (bank) =>
      (status === 'all' || bank.status === status) &&
      (!needle ||
        bank.name.toLowerCase().includes(needle) ||
        bank.swiftCode.toLowerCase().includes(needle)),
  )
  const filtered = needle !== '' || status !== 'all'

  // Duplicate SWIFT codes are checked by the server and shown under the field
  const save = async (values: IssuingBankFormValues) => {
    try {
      await saveBank.mutateAsync({ id: editing?.id, values })
      toast.success(editing ? `${values.name} updated` : `${values.name} added`)
      close()
    } catch (error) {
      return formErrorsFrom(error)
    }
  }

  const addButton = canManage && (
    <Button onClick={() => setDialog({ mode: 'add' })}>
      <Plus /> Add issuing bank
    </Button>
  )

  return (
    <Page
      title="Issuing banks"
      figures={[
        { label: 'Banks', value: banks.length },
        { label: 'Active', value: activeCount },
        { label: 'Inactive', value: banks.length - activeCount },
      ]}
      toolbar={
        banks.length > 0 && (
          <>
            <SearchInput
              label="Search banks"
              placeholder="Search by name or SWIFT code"
              value={query}
              onChange={setQuery}
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
      <IssuingBanksTable
        banks={visible}
        onEdit={canManage ? (bank) => setDialog({ mode: 'edit', bank }) : undefined}
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
        title={editing ? 'Edit issuing bank' : 'Add issuing bank'}
        description={editing ? editing.name : 'The bank appears in user and transaction filters.'}
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
