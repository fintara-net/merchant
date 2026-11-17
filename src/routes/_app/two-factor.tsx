import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { CircleAlert, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { FormError } from '@/components/ui/form-error'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/table'
import { toast } from '@/components/ui/toast'
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
import { formatDate } from '@/lib/utils'

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
  const left = status.data?.recoveryCodesLeft
  const low = left !== undefined && left <= LOW_RECOVERY_CODES

  return (
    <Page
      title="Two-factor authentication"
      description="You sign in with your password and a code from your authenticator app."
      figures={
        status.data
          ? [
              { label: 'Status', value: 'On' },
              ...(status.data.enabledAt
                ? [{ label: 'Turned on', value: formatDate(status.data.enabledAt) }]
                : []),
              {
                label: 'Recovery codes left',
                value: `${status.data.recoveryCodesLeft} of 10`,
              },
            ]
          : undefined
      }
      panel={false}
      className="max-w-3xl"
    >
      {status.isPending && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-72" />
          </CardContent>
        </Card>
      )}
      {status.isError && (
        <Card>
          <EmptyState
            icon={<CircleAlert />}
            title="Couldn't load your two-factor settings"
            description="Check your connection, then try again."
            action={
              <Button variant="outline" onClick={() => void status.refetch()}>
                Try again
              </Button>
            }
          />
        </Card>
      )}

      {status.data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Recovery codes</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
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
                      toast.success('New recovery codes saved')
                      void queryClient.invalidateQueries({ queryKey: twoFactorKeys.status() })
                    }}
                  />
                </>
              ) : (
                <>
                  {low && (
                    <p className="flex items-center gap-2 rounded-md border border-warning/25 bg-warning-soft px-3 py-2 text-sm text-warning">
                      <TriangleAlert className="size-4 shrink-0" />
                      Only {status.data.recoveryCodesLeft} left. Get a new set so you don&apos;t run
                      out.
                    </p>
                  )}
                  <p className="text-sm text-muted">
                    Each code signs you in once if you can&apos;t use your authenticator app.
                    Getting a new set makes all your current codes stop working.
                  </p>
                  <RegenerateForm onDone={setNewCodes} />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lost your phone?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">
              {user.userType === 'super-admin'
                ? 'Sign in with a recovery code. Without one, ask the person who runs the Fintara server to reset your two-factor sign-in.'
                : 'Sign in with a recovery code, or ask your administrator to reset two-factor sign-in so you can set it up again on a new phone.'}
            </CardContent>
          </Card>
        </>
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
    <form noValidate className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(submit)}>
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
          className="tracking-widest"
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
        loading={isSubmitting}
      >
        Get new recovery codes
      </Button>
    </form>
  )
}
