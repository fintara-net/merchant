import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, Label } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { merchantFormSchema, type MerchantFormInput, type MerchantFormValues } from '../schemas'

type UniqueField = 'merchantCode' | 'panNumber'

interface MerchantFormProps {
  defaultValues?: MerchantFormInput
  submitLabel: string
  /** Return field errors to block saving, e.g. a duplicate merchant code */
  onSubmit: (values: MerchantFormValues) => Partial<Record<UniqueField, string>> | void
  onCancel: () => void
}

const EMPTY: MerchantFormInput = {
  name: '',
  merchantCode: '',
  panNumber: '',
  phoneNumber: '',
  email: '',
  status: 'active',
}

export function MerchantForm({
  defaultValues = EMPTY,
  submitLabel,
  onSubmit,
  onCancel,
}: MerchantFormProps) {
  const form = useForm<MerchantFormInput, unknown, MerchantFormValues>({
    resolver: zodResolver(merchantFormSchema),
    defaultValues,
  })
  const { errors, isSubmitting } = form.formState

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={form.handleSubmit((values) => {
        const fieldErrors = onSubmit(values)
        for (const [field, message] of Object.entries(fieldErrors ?? {})) {
          form.setError(field as UniqueField, { message })
        }
      })}
    >
      <Field id="merchant-name" label="Merchant name" error={errors.name}>
        <Input
          id="merchant-name"
          autoFocus
          autoComplete="off"
          placeholder="Enter merchant name"
          aria-invalid={!!errors.name}
          {...form.register('name')}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="merchant-code" label="Merchant code" error={errors.merchantCode}>
          <Input
            id="merchant-code"
            maxLength={15}
            autoComplete="off"
            spellCheck={false}
            placeholder="Enter merchant code"
            className="uppercase placeholder:normal-case"
            aria-invalid={!!errors.merchantCode}
            {...form.register('merchantCode')}
          />
        </Field>
        <Field id="merchant-pan" label="PAN/VAT number" error={errors.panNumber}>
          <Input
            id="merchant-pan"
            inputMode="numeric"
            maxLength={9}
            autoComplete="off"
            placeholder="Enter PAN number"
            aria-invalid={!!errors.panNumber}
            {...form.register('panNumber')}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="merchant-phone" label="Phone number" error={errors.phoneNumber}>
          <Input
            id="merchant-phone"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            autoComplete="off"
            placeholder="Enter phone number"
            aria-invalid={!!errors.phoneNumber}
            {...form.register('phoneNumber')}
          />
        </Field>
        <Field id="merchant-email" label="Email" error={errors.email}>
          <Input
            id="merchant-email"
            type="email"
            autoComplete="off"
            placeholder="Enter email address"
            aria-invalid={!!errors.email}
            {...form.register('email')}
          />
        </Field>
      </div>

      <Controller
        control={form.control}
        name="status"
        render={({ field }) => (
          <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
            <div>
              <Label htmlFor="merchant-status">Active</Label>
              <p className="mt-0.5 text-xs text-muted">
                Turn off to mark this merchant as inactive.
              </p>
            </div>
            <Switch
              id="merchant-status"
              checked={field.value === 'active'}
              onCheckedChange={(on) => field.onChange(on ? 'active' : 'inactive')}
            />
          </div>
        )}
      />

      <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
