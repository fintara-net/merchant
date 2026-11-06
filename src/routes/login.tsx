import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Logo } from '@/components/brand/logo'
import { BrandWave } from '@/components/brand/wave'
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
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <BrandPanel />
      <main className="flex flex-col bg-surface px-6 py-10 sm:px-10">
        <div className="flex flex-1 items-center justify-center">
          <SignIn />
        </div>
        <p className="mt-10 text-center text-xs text-muted">
          Powered by <span className="font-semibold text-foreground">{BRAND.poweredBy}</span>
        </p>
      </main>
    </div>
  )
}

/** Left side on desktop; a compact banner above the form on mobile. */
function BrandPanel() {
  return (
    <section className="relative isolate flex flex-col overflow-hidden bg-brand-black px-6 py-8 text-white sm:px-10 lg:min-h-dvh lg:p-14">
      <BrandWave className="absolute inset-0 -z-10 size-full opacity-90" />
      {/* Fade the wave toward the text so copy stays readable */}
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/85 via-black/10 to-transparent" />

      <Logo />

      <div className="mt-10 max-w-md lg:mt-auto">
        <p className="text-xs font-semibold tracking-[0.25em] text-brand-400 uppercase">
          {BRAND.productName}
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-bold text-balance sm:text-4xl lg:text-5xl">
          Every payment.
          <br />
          One clear view.
        </h1>
      </div>

      <p className="mt-12 hidden text-xs text-white/50 lg:block">
        © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
      </p>
    </section>
  )
}

/** Password first; then, for accounts with 2FA, the code from the authenticator app. */
function SignIn() {
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
  onCodeRequired,
}: {
  notice: string | null
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
    <div className="w-full max-w-sm">
      <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
      <p className="mt-1.5 text-sm text-muted">Sign in to your {BRAND.name} account to continue.</p>

      {notice && !mutation.isError && (
        <p role="alert" className="mt-6 rounded-lg bg-danger/10 p-3 text-sm text-danger">
          {notice}
        </p>
      )}

      <form
        noValidate
        className="mt-8 flex flex-col gap-5"
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
            placeholder="you@company.com"
            className="h-11"
            aria-invalid={!!errors.login}
            aria-describedby={errors.login ? 'login-error' : undefined}
            {...form.register('login')}
          />
          {errors.login && (
            <p id="login-error" className="text-xs text-danger">
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
              placeholder="••••••••"
              className="h-11 pr-11"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...form.register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-xs text-danger">
              {errors.password.message}
            </p>
          )}
        </div>

        {mutation.isError && (
          <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
            {loginErrorMessage(mutation.error)}
          </p>
        )}

        <Button type="submit" className="mt-1 h-11 font-semibold" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        Trouble signing in? Contact your administrator.
      </p>
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
    <div className="w-full max-w-sm">
      <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
        <ShieldCheck className="size-5" />
      </span>
      <h2 className="mt-4 text-2xl font-bold tracking-tight">Two-factor authentication</h2>
      <p className="mt-1.5 text-sm text-muted">
        {mode === 'app'
          ? `Open your authenticator app and enter the 6-digit code for ${BRAND.name}.`
          : 'Enter one of the recovery codes you saved when you set up two-factor authentication. Each code works once.'}
      </p>

      {mode === 'app' ? (
        <AppCodeForm key="app" ticket={challenge.ticket} onRestart={onRestart} />
      ) : (
        <RecoveryCodeForm key="recovery" ticket={challenge.ticket} onRestart={onRestart} />
      )}

      <div className="mt-6 flex flex-col items-center gap-3 text-sm">
        <button
          type="button"
          className="font-semibold text-primary hover:underline"
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
        setRootError('Too many attempts. Please wait a minute and try again.')
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
      className="mt-8 flex flex-col gap-5"
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
          className="h-12 text-center font-mono text-xl tracking-[0.4em] tabular-nums"
          aria-invalid={!!errors.code}
          {...form.register('code')}
        />
      </Field>
      <FormError message={errors.root?.message} />
      <Button type="submit" className="h-11 font-semibold" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        {mutation.isPending ? 'Checking…' : 'Verify'}
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
      className="mt-8 flex flex-col gap-5"
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
      <Button type="submit" className="h-11 font-semibold" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        {mutation.isPending ? 'Checking…' : 'Sign in'}
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
        return 'Invalid email/username or password.'
      case 403:
        return "This account can't use the dashboard yet. Contact your administrator."
      case 429:
        return 'Too many sign-in attempts. Please wait a minute and try again.'
    }
  }
  return 'Something went wrong. Please try again.'
}
