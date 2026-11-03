import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { FormError } from '@/components/ui/form-error'
import { applyFormErrors, type FormErrors } from '@/lib/form-errors'
import { Field } from '@/components/ui/field'
import { Input, Label } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  merchantCreateFormSchema,
  merchantFormSchema,
  type MerchantCreateFormInput,
  type MerchantCreateFormValues,
  type MerchantFormValues,
} from '../schemas'

/** On edit there's no login part: the login is managed on the Users page */
export type MerchantSubmitValues = MerchantFormValues & {
  login?: MerchantCreateFormValues['login']
}

interface MerchantFormProps {
  defaultValues?: MerchantCreateFormInput
  /** Editing hides the login fields and shows the existing username instead */
  isEdit?: boolean
  /** Username of the merchant's login, shown when editing */
  loginUsername?: string
  submitLabel: string
  /** Saves; resolves to errors from the server (e.g. duplicates) when it fails */
  onSubmit: (values: MerchantSubmitValues) => Promise<FormErrors | void>
  onCancel: () => void
}

const EMPTY: MerchantCreateFormInput = {
  name: '',
  merchantCode: '',
  panNumber: '',
  phoneNumber: '',
  email: '',
  status: 'active',
  login: { username: '', firstName: '', lastName: '' },
}

export function MerchantForm({
  defaultValues = EMPTY,
  isEdit = false,
  loginUsername,
  submitLabel,
  onSubmit,
  onCancel,
}: MerchantFormProps) {
  const form = useForm<MerchantCreateFormInput, unknown, MerchantCreateFormValues>({
    // Editing validates business details only; the login fields aren't shown
    resolver: (isEdit
      ? zodResolver(merchantFormSchema)
      : zodResolver(merchantCreateFormSchema)) as Resolver<
      MerchantCreateFormInput,
      unknown,
      MerchantCreateFormValues
    >,
    defaultValues,
  })
  const { errors, isSubmitting } = form.formState

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(async (values) => {
        const errors = await onSubmit(values)
        if (errors) applyFormErrors(form.setError, errors)
      })}
    >
      <Section title="Business details">
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
      </Section>

      <Section
        title="Login"
        description={
          isEdit
            ? 'Lock, reset password or edit the login on the Users page.'
            : 'The merchant signs in with this username. The email and phone above are used for the login too.'
        }
      >
        {isEdit ? (
          <Field id="merchant-login-username" label="Username">
            <Input
              id="merchant-login-username"
              readOnly
              value={loginUsername ?? 'No login yet'}
              className="bg-accent text-muted"
            />
          </Field>
        ) : (
          <>
            <Field id="merchant-login-username" label="Username" error={errors.login?.username}>
              <Input
                id="merchant-login-username"
                autoComplete="off"
                spellCheck={false}
                placeholder="Enter username"
                aria-invalid={!!errors.login?.username}
                {...form.register('login.username')}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="merchant-login-first-name"
                label="Contact first name"
                error={errors.login?.firstName}
              >
                <Input
                  id="merchant-login-first-name"
                  autoComplete="off"
                  placeholder="Enter first name"
                  aria-invalid={!!errors.login?.firstName}
                  {...form.register('login.firstName')}
                />
              </Field>
              <Field
                id="merchant-login-last-name"
                label="Contact last name"
                error={errors.login?.lastName}
              >
                <Input
                  id="merchant-login-last-name"
                  autoComplete="off"
                  placeholder="Enter last name"
                  aria-invalid={!!errors.login?.lastName}
                  {...form.register('login.lastName')}
                />
              </Field>
            </div>
          </>
        )}
      </Section>

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

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <fieldset className="flex flex-col gap-4">
      {/* legend must be the fieldset's first child for screen readers */}
      <legend className="float-left w-full text-sm font-semibold">
        {title}
        {description && (
          <span className="mt-0.5 block text-xs font-normal text-muted">{description}</span>
        )}
      </legend>
      {children}
    </fieldset>
  )
}
