import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  issuingBankFormSchema,
  type IssuingBankFormInput,
  type IssuingBankFormValues,
} from '../schemas'

interface IssuingBankFormProps {
  defaultValues?: IssuingBankFormInput
  submitLabel: string
  /** Return an error message for the SWIFT field to block saving (e.g. duplicate) */
  onSubmit: (values: IssuingBankFormValues) => string | void
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
      onSubmit={form.handleSubmit((values) => {
        const swiftError = onSubmit(values)
        if (swiftError) form.setError('swiftCode', { message: swiftError })
      })}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bank-name">Bank name</Label>
        <Input
          id="bank-name"
          autoFocus
          placeholder="e.g. Nabil Bank Limited"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'bank-name-error' : undefined}
          {...form.register('name')}
        />
        {errors.name && (
          <p id="bank-name-error" className="text-xs text-danger">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="swift-code">SWIFT code</Label>
        <Input
          id="swift-code"
          placeholder="e.g. NARBNPKA"
          maxLength={11}
          autoComplete="off"
          spellCheck={false}
          className="font-mono tracking-wider uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case"
          aria-invalid={!!errors.swiftCode}
          aria-describedby="swift-code-hint"
          {...form.register('swiftCode')}
        />
        {errors.swiftCode ? (
          <p id="swift-code-hint" className="text-xs text-danger">
            {errors.swiftCode.message}
          </p>
        ) : (
          <p id="swift-code-hint" className="text-xs text-muted">
            8 or 11 characters, letters and numbers.
          </p>
        )}
      </div>

      <Controller
        control={form.control}
        name="status"
        render={({ field }) => (
          <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
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
