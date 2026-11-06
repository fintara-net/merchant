import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Loader2, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { FormError } from '@/components/ui/form-error'
import { Input } from '@/components/ui/input'
import { sessionQueryOptions } from '@/features/auth/api'
import { RecoveryCodes } from '@/features/auth/components/recovery-codes'
import {
  regenerateRecoveryCodes,
  regenerateRecoveryCodesSchema,
  twoFactorKeys,
  twoFactorStatusQueryOptions,
} from '@/features/auth/two-factor'
import { isUnauthorized } from '@/lib/api-client'
import { applyFormErrors, formErrorsFrom } from '@/lib/form-errors'
import { formatDateTime } from '@/lib/utils'

/** The signed-in user's 2FA: when it was turned on, and new recovery codes. */
export const Route = createFileRoute('/_app/two-factor')({
  component: TwoFactorPage,
})

/** Few enough codes left that the user should get a new set */
const LOW_RECOVERY_CODES = 3

function TwoFactorPage() {
  const { data: user } = useSuspenseQuery(sessionQueryOptions)
  const status = useQuery(twoFactorStatusQueryOptions)
  const queryClient = useQueryClient()
  const [newCodes, setNewCodes] = useState<string[] | null>(null)

  return (
    <Page
      title="Two-factor authentication"
      description="You sign in with your password and a code from your authenticator app."
      className="max-w-2xl"
    >
      {status.isPending && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </p>
      )}
      {status.isError && <FormError message="Couldn't load your two-factor settings." />}

      {status.data && (
        <div className="flex flex-col gap-8">
          <div className="flex items-start gap-3 rounded-xl border p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <div className="text-sm">
              <p className="font-semibold">On</p>
              {status.data.enabledAt && (
                <p className="text-muted">Since {formatDateTime(status.data.enabledAt)}</p>
              )}
              <p className="mt-2 text-muted">
                {user.userType === 'super-admin'
                  ? 'Lost your phone? Sign in with a recovery code. Without one, it can be reset on the server (see the README).'
                  : 'Lost your phone? Sign in with a recovery code, or ask your administrator to reset two-factor authentication so you can set it up again.'}
              </p>
            </div>
          </div>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Recovery codes</h2>
            {newCodes ? (
              <>
                <p className="text-sm text-muted">
                  Your old codes no longer work. Save these new ones; they won&apos;t be shown
                  again.
                </p>
                <RecoveryCodes
                  codes={newCodes}
                  accountName={user.username}
                  doneLabel="Done"
                  onDone={() => {
                    setNewCodes(null)
                    void queryClient.invalidateQueries({ queryKey: twoFactorKeys.status() })
                  }}
                />
              </>
            ) : (
              <>
                <p
                  className={
                    status.data.recoveryCodesLeft <= LOW_RECOVERY_CODES
                      ? 'flex items-center gap-2 text-sm text-danger'
                      : 'text-sm text-muted'
                  }
                >
                  {status.data.recoveryCodesLeft <= LOW_RECOVERY_CODES && (
                    <TriangleAlert className="size-4 shrink-0" />
                  )}
                  {status.data.recoveryCodesLeft} of 10 unused.
                  {status.data.recoveryCodesLeft <= LOW_RECOVERY_CODES &&
                    ' Get a new set so you don’t run out.'}
                </p>
                <RegenerateForm onDone={setNewCodes} />
              </>
            )}
          </section>
        </div>
      )}
    </Page>
  )
}

type RegenerateInput = z.input<typeof regenerateRecoveryCodesSchema>
type RegenerateOutput = z.output<typeof regenerateRecoveryCodesSchema>

/** New codes need the password and a current code, so an open laptop alone isn't enough. */
function RegenerateForm({ onDone }: { onDone: (codes: string[]) => void }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const form = useForm<RegenerateInput, unknown, RegenerateOutput>({
    resolver: zodResolver(regenerateRecoveryCodesSchema),
    defaultValues: { password: '', code: '' },
  })
  const { errors, isSubmitting } = form.formState

  const submit = async (values: RegenerateOutput) => {
    try {
      onDone(await regenerateRecoveryCodes(values))
    } catch (error) {
      // Too many wrong attempts: the server signed this user out everywhere
      if (isUnauthorized(error)) {
        queryClient.clear()
        await router.navigate({ to: '/login' })
        return
      }
      applyFormErrors(form.setError, formErrorsFrom(error))
    }
  }

  return (
    <form
      noValidate
      className="mt-2 grid gap-4 rounded-xl border p-4 sm:grid-cols-2"
      onSubmit={form.handleSubmit(submit)}
    >
      <p className="text-sm text-muted sm:col-span-2">
        Getting new codes makes all your current ones stop working.
      </p>
      <Field id="password" label="Password" error={errors.password}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...form.register('password')}
        />
      </Field>
      <Field id="code" label="Code from your app" error={errors.code}>
        <Input
          id="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={7}
          className="font-mono tracking-widest tabular-nums"
          aria-invalid={!!errors.code}
          {...form.register('code')}
        />
      </Field>
      <div className="sm:col-span-2">
        <FormError message={errors.root?.message} />
      </div>
      <Button
        type="submit"
        variant="outline"
        className="sm:col-span-2 sm:justify-self-start"
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Get new recovery codes
      </Button>
    </form>
  )
}
