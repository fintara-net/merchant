import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldAlert } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { FormError } from '@/components/ui/form-error'
import { applyFormErrors, type FormErrors } from '@/lib/form-errors'
import { Field } from '@/components/ui/field'
import { Input, Label } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useQuery } from '@tanstack/react-query'
import { issuingBanksQueryOptions } from '@/features/issuing-banks'
import { useOrganisationOptions } from '@/features/organisations'
import { useOrganisationName } from '../organisation'
import {
  CREATABLE_USER_TYPES,
  USER_TYPE_LABELS,
  userFormSchema,
  type UserFormInput,
  type UserFormValues,
} from '../schemas'

interface UserFormProps {
  defaultValues?: UserFormInput
  /** Username, user type and organisation can't change once created */
  isEdit?: boolean
  submitLabel: string
  /** Saves; resolves to errors from the server (e.g. duplicates) when it fails */
  onSubmit: (values: UserFormValues) => Promise<FormErrors | void>
  onCancel: () => void
}

const EMPTY: UserFormInput = {
  username: '',
  firstName: '',
  middleName: '',
  lastName: '',
  phoneNumber: '',
  email: '',
  userType: 'bank',
  bankId: '',
  merchantId: '',
  status: 'active',
}

export function UserForm({
  defaultValues = EMPTY,
  isEdit = false,
  submitLabel,
  onSubmit,
  onCancel,
}: UserFormProps) {
  // Only active organisations can get new users
  const { data: banks = [] } = useQuery(issuingBanksQueryOptions)
  const activeBanks = banks.filter((b) => b.status === 'active')
  // Merchant logins are created on the Merchants page; this list only labels existing ones
  const activeMerchants = useOrganisationOptions().merchants
  const organisationName = useOrganisationName()
  const form = useForm<UserFormInput, unknown, UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues,
  })
  const { errors, isSubmitting } = form.formState
  const [userType, bankId, merchantId] = useWatch({
    control: form.control,
    name: ['userType', 'bankId', 'merchantId'],
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={form.handleSubmit(async (values) => {
        const errors = await onSubmit(values)
        if (errors) applyFormErrors(form.setError, errors)
      })}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="user-first-name" label="First name" error={errors.firstName}>
          <Input
            id="user-first-name"
            autoFocus
            autoComplete="off"
            placeholder="Enter first name"
            aria-invalid={!!errors.firstName}
            {...form.register('firstName')}
          />
        </Field>
        <Field id="user-middle-name" label="Middle name" optional error={errors.middleName}>
          <Input
            id="user-middle-name"
            autoComplete="off"
            placeholder="Enter middle name"
            aria-invalid={!!errors.middleName}
            {...form.register('middleName')}
          />
        </Field>
        <Field id="user-last-name" label="Last name" error={errors.lastName}>
          <Input
            id="user-last-name"
            autoComplete="off"
            placeholder="Enter last name"
            aria-invalid={!!errors.lastName}
            {...form.register('lastName')}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="user-username" label="Username" error={errors.username}>
          <Input
            id="user-username"
            readOnly={isEdit}
            autoComplete="off"
            placeholder="Enter username"
            className="read-only:bg-accent read-only:text-muted"
            aria-invalid={!!errors.username}
            {...form.register('username')}
          />
        </Field>
        <Field id="user-phone" label="Phone number" error={errors.phoneNumber}>
          <Input
            id="user-phone"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="Enter phone number"
            aria-invalid={!!errors.phoneNumber}
            {...form.register('phoneNumber')}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field id="user-email" label="Email" error={errors.email}>
            <Input
              id="user-email"
              type="email"
              placeholder="Enter email address"
              aria-invalid={!!errors.email}
              {...form.register('email')}
            />
          </Field>
        </div>

        {isEdit ? (
          // Type and organisation are fixed once created, so a user can't be
          // moved to another bank and see its data
          <>
            <Field id="user-type" label="User type" hint="Can't be changed after creation.">
              <Input
                id="user-type"
                readOnly
                value={USER_TYPE_LABELS[userType]}
                className="bg-accent text-muted"
              />
            </Field>
            <Field id="user-organisation" label="Organisation">
              <Input
                id="user-organisation"
                readOnly
                value={organisationName({ userType, bankId, merchantId })}
                className="bg-accent text-muted"
              />
            </Field>
          </>
        ) : (
          <>
            <Field id="user-type" label="User type" error={errors.userType}>
              <Select id="user-type" {...form.register('userType')}>
                {CREATABLE_USER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {USER_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </Field>

            {userType === 'bank' && (
              <Field id="user-bank" label="Issuing bank" error={errors.bankId}>
                <Select id="user-bank" aria-invalid={!!errors.bankId} {...form.register('bankId')}>
                  <option value="">Select a bank</option>
                  {activeBanks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            {/* Not reachable yet: merchant logins are created on the Merchants page.
                Kept for when merchants can have several staff logins. */}
            {userType === 'merchant' && (
              <Field id="user-merchant" label="Merchant" error={errors.merchantId}>
                <Select
                  id="user-merchant"
                  aria-invalid={!!errors.merchantId}
                  {...form.register('merchantId')}
                >
                  <option value="">Select a merchant</option>
                  {activeMerchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            {userType === 'super-admin' && (
              <div className="flex gap-2 self-end rounded-lg bg-warning-soft p-3 text-xs text-warning">
                <ShieldAlert className="size-4 shrink-0" />
                Full access to all banks, merchants and users.
              </div>
            )}
          </>
        )}
      </div>

      <Controller
        control={form.control}
        name="status"
        render={({ field }) => (
          <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
            <div>
              <Label htmlFor="user-status">Active</Label>
              <p className="mt-0.5 text-xs text-muted">Inactive users can't sign in.</p>
            </div>
            <Switch
              id="user-status"
              checked={field.value === 'active'}
              onCheckedChange={(on) => field.onChange(on ? 'active' : 'inactive')}
            />
          </div>
        )}
      />

      <FormError message={errors.root?.message} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
