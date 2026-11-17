import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Eye, EyeOff, Info } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AuthHeading, AuthLayout } from '@/components/layout/auth-layout'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { FormError } from '@/components/ui/form-error'
import { Input, Label } from '@/components/ui/input'
import { BRAND } from '@/config/brand'
import {
  authKeys,
  login,
  loginSchema,
  loginWithCode,
  recoveryCodeSchema,
  sessionQueryOptions,
  twoFactorCodeSchema,
  type LoginInput,
  type TwoFactorChallenge,
  type User,
} from '@/features/auth/api'
import { ApiError, NetworkError, isUnauthorized } from '@/lib/api-client'
import { applyFormErrors, formErrorsFrom } from '@/lib/form-errors'
import { safeRedirect } from '@/lib/utils'

export const Route = createFileRoute('/login')({
  validateSearch: z.object({
    redirect: z.string().optional(),
    /** Set when the session ended while the user was working */
    expired: z.boolean().optional().catch(undefined),
  }),
  component: LoginPage,
})

function LoginPage() {
  return (
    <AuthLayout footer={<span>Trouble signing in? Contact your administrator.</span>}>
      <SignIn />
    </AuthLayout>
  )
}

/** Password first; then, for accounts with 2FA, the code from the authenticator app. */
function SignIn() {
  const { expired } = Route.useSearch()
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null)
  // Why the user is back at the password step (e.g. the code step timed out)
  const [restartReason, setRestartReason] = useState<string | null>(null)

  if (challenge) {
    return (
      <CodeStep
        challenge={challenge}
        onRestart={(reason) => {
          setChallenge(null)
          setRestartReason(reason)
        }}
      />
    )
  }
  return (
    <LoginForm
      notice={restartReason}
      sessionEnded={!!expired && restartReason === null}
      onCodeRequired={(c) => {
        setRestartReason(null)
        setChallenge(c)
      }}
    />
  )
}

/** Seeds the new session and goes where the user was headed */
function useFinishSignIn() {
  const { redirect } = Route.useSearch()
  const router = useRouter()
  const queryClient = useQueryClient()
  return (user: User) => {
    // Drop any data from a previous session, then seed the new one
    queryClient.removeQueries({ queryKey: authKeys.all })
    queryClient.setQueryData(sessionQueryOptions.queryKey, user)
    router.history.push(safeRedirect(redirect))
  }
}

function LoginForm({
  notice,
  sessionEnded,
  onCodeRequired,
}: {
  notice: string | null
  /** Signed out while working: say so calmly, it isn't an error */
  sessionEnded: boolean
  onCodeRequired: (challenge: TwoFactorChallenge) => void
}) {
  const finish = useFinishSignIn()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: '', password: '' },
  })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (outcome) => {
      if (outcome.kind === 'code-required') onCodeRequired(outcome.challenge)
      else finish(outcome.user)
    },
  })

  const { errors } = form.formState

  return (
    <div>
      <AuthHeading
        title="Sign in"
        description={`Use your ${BRAND.name} email or username and password.`}
      />

      {notice && !mutation.isError && (
        <div className="mb-5">
          <FormError message={notice} />
        </div>
      )}
      {sessionEnded && !notice && !mutation.isError && (
        <p
          role="status"
          className="mb-5 flex items-start gap-2 rounded-md border border-primary-soft-border bg-primary-soft px-3 py-2.5 text-sm"
        >
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
          Your session ended, so you were signed out. Sign in again to continue.
        </p>
      )}

      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login">Email or username</Label>
          <Input
            id="login"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className="h-10"
            aria-invalid={!!errors.login}
            aria-describedby={errors.login ? 'login-error' : undefined}
            {...form.register('login')}
          />
          {errors.login && (
            <p id="login-error" className="text-xs font-medium text-danger">
              {errors.login.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="h-10 pr-10"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...form.register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-muted hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-xs font-medium text-danger">
              {errors.password.message}
            </p>
          )}
        </div>

        <FormError message={mutation.isError ? loginErrorMessage(mutation.error) : undefined} />

        <Button type="submit" className="mt-1 h-10" loading={mutation.isPending}>
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}

type CodeMode = 'app' | 'recovery'

/**
 * The 6-digit code from the authenticator app, or one of the recovery codes. A timed-out
 * ticket or too many wrong codes sends the user back to the password step with the reason.
 */
function CodeStep({
  challenge,
  onRestart,
}: {
  challenge: TwoFactorChallenge
  onRestart: (reason: string) => void
}) {
  const [mode, setMode] = useState<CodeMode>('app')

  return (
    <div>
      <AuthHeading
        step="Step 2 of 2"
        title={mode === 'app' ? 'Enter your authentication code' : 'Use a recovery code'}
        description={
          mode === 'app'
            ? `Open your authenticator app and enter the 6-digit code for ${BRAND.name}.`
            : 'Enter one of the recovery codes you saved when you set up two-factor authentication. Each code works once.'
        }
      />

      {mode === 'app' ? (
        <AppCodeForm key="app" ticket={challenge.ticket} onRestart={onRestart} />
      ) : (
        <RecoveryCodeForm key="recovery" ticket={challenge.ticket} onRestart={onRestart} />
      )}

      <div className="mt-6 flex flex-col items-center gap-3 text-sm">
        <button
          type="button"
          className="font-semibold text-primary underline-offset-4 hover:underline"
          onClick={() => setMode(mode === 'app' ? 'recovery' : 'app')}
        >
          {mode === 'app'
            ? "Can't use your app? Use a recovery code"
            : 'Use your authenticator app'}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-muted hover:text-foreground"
          onClick={() => onRestart('')}
        >
          <ArrowLeft className="size-3.5" /> Back to sign in
        </button>
      </div>
    </div>
  )
}

/** Shared by both code forms: finishing sign-in, and what each kind of failure means */
function useCodeSubmit<T extends { code: string } | { recoveryCode: string }>(
  ticket: string,
  onRestart: (reason: string) => void,
  setRootError: (message: string) => void,
  applyFieldErrors: (error: unknown) => void,
) {
  const finish = useFinishSignIn()
  return useMutation({
    mutationFn: (values: T) => loginWithCode(ticket, values),
    onSuccess: finish,
    onError: (error) => {
      // Ticket timed out, or too many wrong codes locked the account
      if (isUnauthorized(error)) onRestart(error.message)
      else if (error instanceof ApiError && error.status === 429)
        setRootError('Too many attempts. Wait a minute, then try again.')
      else applyFieldErrors(error)
    },
  })
}

function AppCodeForm({ ticket, onRestart }: { ticket: string; onRestart: (r: string) => void }) {
  const form = useForm<
    z.input<typeof twoFactorCodeSchema>,
    unknown,
    z.output<typeof twoFactorCodeSchema>
  >({
    resolver: zodResolver(twoFactorCodeSchema),
    defaultValues: { code: '' },
  })
  const mutation = useCodeSubmit<{ code: string }>(
    ticket,
    onRestart,
    (message) => form.setError('root', { message }),
    (error) => {
      applyFormErrors(form.setError, formErrorsFrom(error))
      form.setValue('code', '')
      form.setFocus('code')
    },
  )
  const { errors } = form.formState

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
    >
      <Field id="code" label="Authentication code" error={errors.code}>
        <Input
          id="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={7}
          className="h-12 text-center text-xl font-semibold tracking-[0.4em]"
          aria-invalid={!!errors.code}
          {...form.register('code')}
        />
      </Field>
      <FormError message={errors.root?.message} />
      <Button type="submit" className="h-10" loading={mutation.isPending}>
        {mutation.isPending ? 'Checking…' : 'Verify and sign in'}
      </Button>
    </form>
  )
}

function RecoveryCodeForm({
  ticket,
  onRestart,
}: {
  ticket: string
  onRestart: (r: string) => void
}) {
  const form = useForm<
    z.input<typeof recoveryCodeSchema>,
    unknown,
    z.output<typeof recoveryCodeSchema>
  >({
    resolver: zodResolver(recoveryCodeSchema),
    defaultValues: { recoveryCode: '' },
  })
  const mutation = useCodeSubmit<{ recoveryCode: string }>(
    ticket,
    onRestart,
    (message) => form.setError('root', { message }),
    (error) => applyFormErrors(form.setError, formErrorsFrom(error)),
  )
  const { errors } = form.formState

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
    >
      <Field id="recoveryCode" label="Recovery code" error={errors.recoveryCode}>
        <Input
          id="recoveryCode"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          autoFocus
          placeholder="XXXXX-XXXXX"
          className="h-12 text-center font-mono text-lg tracking-widest uppercase"
          aria-invalid={!!errors.recoveryCode}
          {...form.register('recoveryCode')}
        />
      </Field>
      <FormError message={errors.root?.message} />
      <Button type="submit" className="h-10" loading={mutation.isPending}>
        {mutation.isPending ? 'Checking…' : 'Sign in with recovery code'}
      </Button>
    </form>
  )
}

/** Turns a failed sign-in into a message that doesn't reveal whether the account exists. */
function loginErrorMessage(error: Error) {
  if (error instanceof NetworkError) return error.message
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
      case 401:
        return "That email or username and password don't match. Check them and try again."
      case 403:
        return "This account can't use the dashboard yet. Contact your administrator."
      case 429:
        return 'Too many sign-in attempts. Wait a minute, then try again.'
    }
  }
  return 'Sign-in failed because of a problem on our side. Try again in a moment.'
}
