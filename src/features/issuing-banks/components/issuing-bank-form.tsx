import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { FormActions } from '@/components/ui/form-actions'
import { FormError } from '@/components/ui/form-error'
import { Input, Label } from '@/components/ui/input'
import { applyFormErrors, type FormErrors } from '@/lib/form-errors'
import { Switch } from '@/components/ui/switch'
import {
  issuingBankFormSchema,
  type IssuingBankFormInput,
  type IssuingBankFormValues,
} from '../schemas'

interface IssuingBankFormProps {
  defaultValues?: IssuingBankFormInput
  submitLabel: string
  /** Saves; resolves to errors from the server (e.g. a duplicate SWIFT code) when it fails */
  onSubmit: (values: IssuingBankFormValues) => Promise<FormErrors | void>
  onCancel: () => void
}

export function IssuingBankForm({
  defaultValues = { name: '', swiftCode: '', status: 'active' },
  submitLabel,
  onSubmit,
  onCancel,
}: IssuingBankFormProps) {
  const form = useForm<IssuingBankFormInput, unknown, IssuingBankFormValues>({
    resolver: zodResolver(issuingBankFormSchema),
    defaultValues,
  })
  const { errors, isSubmitting } = form.formState

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={form.handleSubmit(async (values) => {
        const errors = await onSubmit(values)
        if (errors) applyFormErrors(form.setError, errors)
      })}
    >
      <Field id="bank-name" label="Bank name" error={errors.name}>
        <Input
          id="bank-name"
          autoFocus
          placeholder="Enter bank name"
          aria-invalid={!!errors.name}
          {...form.register('name')}
        />
      </Field>

      <Field
        id="swift-code"
        label="SWIFT code"
        error={errors.swiftCode}
        hint="8 or 11 letters and numbers, for example ABCDNPKA."
      >
        <Input
          id="swift-code"
          placeholder="Enter SWIFT code"
          maxLength={11}
          autoComplete="off"
          spellCheck={false}
          className="font-mono tracking-wider uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case"
          aria-invalid={!!errors.swiftCode}
          {...form.register('swiftCode')}
        />
      </Field>

      <Controller
        control={form.control}
        name="status"
        render={({ field }) => (
          <div className="flex items-center justify-between gap-4 rounded-md border border-border p-4">
            <div>
              <Label htmlFor="bank-status">Active</Label>
              <p className="mt-0.5 text-xs text-muted">Turn off to mark this bank as inactive.</p>
            </div>
            <Switch
              id="bank-status"
              checked={field.value === 'active'}
              onCheckedChange={(on) => field.onChange(on ? 'active' : 'inactive')}
            />
          </div>
        )}
      />

      <FormError message={errors.root?.message} />

      <FormActions>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </FormActions>
    </form>
  )
}
