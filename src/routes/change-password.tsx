import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { Check, Circle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { FormError } from '@/components/ui/form-error'
import { Input } from '@/components/ui/input'
import { BRAND } from '@/config/brand'
import { authKeys, sessionQueryOptions } from '@/features/auth/api'
import { SignOutLink } from '@/features/auth/components/sign-out-link'
import {
  changePassword,
  changePasswordSchema,
  PASSWORD_RULES,
  type ChangePasswordInput,
} from '@/features/auth/password'
import { isUnauthorized } from '@/lib/api-client'
import { applyFormErrors, formErrorsFrom } from '@/lib/form-errors'
import { cn } from '@/lib/utils'

/**
 * Change your own password. Users with a temporary password are sent here after signing
 * in and can't open anything else until they've chosen their own.
 */
export const Route = createFileRoute('/change-password')({
  beforeLoad: async ({ context: { queryClient }, location }) => {
    try {
      await queryClient.ensureQueryData(sessionQueryOptions)
    } catch (error) {
      if (isUnauthorized(error)) {
        throw redirect({ to: '/login', search: { redirect: location.href } })
      }
      throw error
    }
  },
  component: ChangePasswordPage,
})

function ChangePasswordPage() {
  const { data: user } = useSuspenseQuery(sessionQueryOptions)
  const forced = user.mustChangePassword

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <p className="mb-4 text-center text-sm font-semibold text-primary">{BRAND.name}</p>
        <Card>
          <CardContent className="p-6 sm:p-8">
            <h1 className="text-xl font-bold tracking-tight">
              {forced ? 'Choose your password' : 'Change password'}
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              {forced
                ? "You signed in with a temporary password. Choose your own to continue. You'll stay signed in here, and any other devices will be signed out."
                : "Other devices will be signed out. You'll stay signed in here."}
            </p>
            <ChangePasswordForm />
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-sm text-muted">
          {forced ? (
            <SignOutLink />
          ) : (
            <Link to="/" className="hover:text-foreground">
              Back to dashboard
            </Link>
          )}
        </p>
      </div>
    </main>
  )
}

function ChangePasswordForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [show, setShow] = useState(false)

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  const { errors, isSubmitting } = form.formState
  const newPassword = useWatch({ control: form.control, name: 'newPassword' })

  const submit = async (values: ChangePasswordInput) => {
    try {
      await changePassword(values)
    } catch (error) {
      // Too many wrong current passwords: the server signed this user out everywhere
      if (isUnauthorized(error)) {
        queryClient.clear()
        await router.navigate({ to: '/login' })
        return
      }
      applyFormErrors(form.setError, formErrorsFrom(error))
      return
    }
    // The session now has no temporary-password flag; load it fresh before leaving
    await queryClient.invalidateQueries({ queryKey: authKeys.all })
    await router.navigate({ to: '/' })
  }

  const passwordInput = (name: keyof ChangePasswordInput, autoComplete: string) => (
    <Input
      id={name}
      type={show ? 'text' : 'password'}
      autoComplete={autoComplete}
      className="h-11"
      aria-invalid={!!errors[name]}
      {...form.register(name)}
    />
  )

  return (
    <form noValidate className="mt-6 flex flex-col gap-5" onSubmit={form.handleSubmit(submit)}>
      <Field id="currentPassword" label="Current password" error={errors.currentPassword}>
        {passwordInput('currentPassword', 'current-password')}
      </Field>

      <Field id="newPassword" label="New password" error={errors.newPassword}>
        {passwordInput('newPassword', 'new-password')}
      </Field>

      <ul className="-mt-2 grid gap-1 text-xs" aria-label="Password rules">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(newPassword)
          return (
            <li
              key={rule.label}
              className={cn('flex items-center gap-1.5', ok ? 'text-success' : 'text-muted')}
            >
              {ok ? <Check className="size-3.5" /> : <Circle className="size-3.5" />}
              {rule.label}
            </li>
          )
        })}
      </ul>

      <Field id="confirmPassword" label="Confirm new password" error={errors.confirmPassword}>
        {passwordInput('confirmPassword', 'new-password')}
      </Field>

      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="-mt-2 flex items-center gap-1.5 self-start text-xs text-muted hover:text-foreground"
      >
        {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        {show ? 'Hide passwords' : 'Show passwords'}
      </button>

      <FormError message={errors.root?.message} />

      <Button type="submit" className="h-11 font-semibold" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {isSubmitting ? 'Saving…' : 'Save password'}
      </Button>
    </form>
  )
}
