import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, Label } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useIssuingBanks } from '@/features/issuing-banks'
import {
  BANK_USER_TYPES,
  USER_TYPE_LABELS,
  USER_TYPES,
  userFormSchema,
  type UserFormInput,
  type UserFormValues,
} from '../schemas'

interface UserFormProps {
  defaultValues?: UserFormInput
  /** Username can't change once created */
  isEdit?: boolean
  submitLabel: string
  /** Return field errors to block saving, e.g. a duplicate username */
  onSubmit: (values: UserFormValues) => Partial<Record<'username' | 'email', string>> | void
  onCancel: () => void
}

const EMPTY: UserFormInput = {
  username: '',
  firstName: '',
  middleName: '',
  lastName: '',
  phoneNumber: '',
  email: '',
  userType: 'member-bank-user',
  bankCode: '',
  status: 'active',
}

export function UserForm({
  defaultValues = EMPTY,
  isEdit = false,
  submitLabel,
  onSubmit,
  onCancel,
}: UserFormProps) {
  const banks = useIssuingBanks((s) => s.banks)
  const form = useForm<UserFormInput, unknown, UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues,
  })
  const { errors, isSubmitting } = form.formState
  const userType = useWatch({ control: form.control, name: 'userType' })
  const needsBank = BANK_USER_TYPES.includes(userType)

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={form.handleSubmit((values) => {
        const fieldErrors = onSubmit(values)
        for (const [field, message] of Object.entries(fieldErrors ?? {})) {
          form.setError(field as 'username' | 'email', { message })
        }
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
        <Field id="user-email" label="Email" error={errors.email}>
          <Input
            id="user-email"
            type="email"
            placeholder="Enter email address"
            aria-invalid={!!errors.email}
            {...form.register('email')}
          />
        </Field>
        <Field id="user-type" label="User type" error={errors.userType}>
          <Select id="user-type" {...form.register('userType')}>
            {USER_TYPES.map((t) => (
              <option key={t} value={t}>
                {USER_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="user-bank" label="Bank" optional={!needsBank} error={errors.bankCode}>
          <Select id="user-bank" aria-invalid={!!errors.bankCode} {...form.register('bankCode')}>
            <option value="">Select a bank</option>
            {banks.map((b) => (
              <option key={b.id} value={b.swiftCode}>
                {b.name} ({b.swiftCode})
              </option>
            ))}
          </Select>
        </Field>
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
