import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { Check, Copy, Loader2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { FormError } from '@/components/ui/form-error'
import { Input } from '@/components/ui/input'
import { BRAND } from '@/config/brand'
import { authKeys, sessionQueryOptions, twoFactorCodeSchema } from '@/features/auth/api'
import { RecoveryCodes } from '@/features/auth/components/recovery-codes'
import { SignOutLink } from '@/features/auth/components/sign-out-link'
import {
  confirmTwoFactor,
  formatSecret,
  twoFactorKeys,
  twoFactorSetupQueryOptions,
  type TwoFactorSetup,
} from '@/features/auth/two-factor'
import { ApiError, isUnauthorized } from '@/lib/api-client'
import { applyFormErrors, formErrorsFrom } from '@/lib/form-errors'

/**
 * Everyone must use an authenticator app. Users without one are sent here after signing in
 * (and after choosing their own password, if they had a temporary one) and can't open
 * anything else until it's set up.
 */
export const Route = createFileRoute('/setup-2fa')({
  beforeLoad: async ({ context: { queryClient }, location }) => {
    let user
    try {
      user = await queryClient.ensureQueryData(sessionQueryOptions)
    } catch (error) {
      if (isUnauthorized(error)) {
        throw redirect({ to: '/login', search: { redirect: location.href } })
      }
      throw error
    }
    if (user.mustChangePassword) throw redirect({ to: '/change-password' })
    if (user.twoFactorEnabled) throw redirect({ to: '/' })
  },
  component: SetupTwoFactorPage,
})

function SetupTwoFactorPage() {
  const { data: user } = useSuspenseQuery(sessionQueryOptions)
  const router = useRouter()
  const queryClient = useQueryClient()
  // Set once the code is confirmed: the codes are shown this one time
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)

  const finish = async () => {
    queryClient.removeQueries({ queryKey: twoFactorKeys.setup })
    // The session now has 2FA on; load it fresh before entering the dashboard
    await queryClient.invalidateQueries({ queryKey: authKeys.all })
    await router.navigate({ to: '/' })
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <p className="mb-4 text-center text-sm font-semibold text-primary">{BRAND.name}</p>
        <Card>
          <CardContent className="p-6 sm:p-8">
            {recoveryCodes ? (
              <>
                <h1 className="text-xl font-bold tracking-tight">Save your recovery codes</h1>
                <p className="mt-1.5 mb-6 text-sm text-muted">
                  Two-factor authentication is on. If you lose your phone, each of these codes signs
                  you in once. They won&apos;t be shown again.
                </p>
                <RecoveryCodes
                  codes={recoveryCodes}
                  accountName={user.username}
                  onDone={() => void finish()}
                  doneLabel="Continue to dashboard"
                />
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold tracking-tight">
                  Set up two-factor authentication
                </h1>
                <p className="mt-1.5 text-sm text-muted">
                  Each time you sign in, you&apos;ll enter your password and a code from an
                  authenticator app on your phone, so a stolen password alone can&apos;t be used to
                  get in.
                </p>
                <SetupSteps onEnabled={setRecoveryCodes} />
              </>
            )}
          </CardContent>
        </Card>
        {!recoveryCodes && (
          <p className="mt-4 text-center text-sm text-muted">
            <SignOutLink />
          </p>
        )}
      </div>
    </main>
  )
}

function SetupSteps({ onEnabled }: { onEnabled: (codes: string[]) => void }) {
  const setup = useQuery(twoFactorSetupQueryOptions)

  if (setup.isPending) {
    return (
      <p className="mt-8 flex items-center gap-2 text-sm text-muted">
        <Loader2 className="size-4 animate-spin" /> Preparing your QR code…
      </p>
    )
  }
  if (setup.isError) {
    return (
      <div className="mt-6 flex flex-col items-start gap-3">
        <FormError message={formErrorsFrom(setup.error).root ?? "Couldn't start setup."} />
        <Button variant="outline" onClick={() => void setup.refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <ol className="mt-6 flex flex-col gap-6">
      <Step number={1} title="Get an authenticator app">
        <p className="text-sm text-muted">
          For example Google Authenticator or Microsoft Authenticator, from your phone&apos;s app
          store. Any authenticator app works.
        </p>
      </Step>
      <Step number={2} title="Scan this QR code with the app">
        <SecretDisplay setup={setup.data} />
      </Step>
      <Step number={3} title="Enter the 6-digit code the app shows">
        <ConfirmForm onEnabled={onEnabled} />
      </Step>
    </ol>
  )
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[auto_1fr] gap-x-3">
      <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {number}
      </span>
      <div className="flex min-w-0 flex-col gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {children}
      </div>
    </li>
  )
}

function SecretDisplay({ setup }: { setup: TwoFactorSetup }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(setup.secret)
      setCopied(true)
    } catch {
      // Clipboard blocked: the key is still on screen to type in
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* White behind the code even in dark mode, so every camera can read it */}
      <div className="self-start rounded-xl border bg-white p-3">
        <QRCodeSVG
          value={setup.otpAuthUri}
          size={176}
          marginSize={0}
          title={`QR code for ${setup.issuer} (${setup.accountName})`}
        />
      </div>
      <p className="text-sm text-muted">
        The app will list it as{' '}
        <span className="font-medium text-foreground">
          {setup.issuer} ({setup.accountName})
        </span>
        .
      </p>
      <details className="text-sm">
        <summary className="cursor-pointer font-medium text-primary">
          Can&apos;t scan it? Enter a setup key instead
        </summary>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <code className="rounded-lg border bg-background px-3 py-2 font-mono text-sm tracking-wider select-all">
            {formatSecret(setup.secret)}
          </code>
          <Button variant="outline" size="sm" onClick={() => void copy()}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copied' : 'Copy key'}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">
          In the app, choose to enter a key, use your username as the account name, and pick
          &quot;time-based&quot; if asked.
        </p>
      </details>
    </div>
  )
}

type CodeInput = z.input<typeof twoFactorCodeSchema>
type CodeOutput = z.output<typeof twoFactorCodeSchema>

function ConfirmForm({ onEnabled }: { onEnabled: (codes: string[]) => void }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const form = useForm<CodeInput, unknown, CodeOutput>({
    resolver: zodResolver(twoFactorCodeSchema),
    defaultValues: { code: '' },
  })
  const { errors, isSubmitting } = form.formState

  const submit = async ({ code }: CodeOutput) => {
    try {
      onEnabled(await confirmTwoFactor(code))
    } catch (error) {
      if (isUnauthorized(error)) {
        queryClient.clear()
        await router.navigate({ to: '/login' })
        return
      }
      // Already on (e.g. finished in another tab)
      if (error instanceof ApiError && error.status === 409) {
        await queryClient.invalidateQueries({ queryKey: authKeys.all })
        await router.navigate({ to: '/' })
        return
      }
      applyFormErrors(form.setError, formErrorsFrom(error))
      form.setValue('code', '')
      form.setFocus('code')
    }
  }

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={form.handleSubmit(submit)}>
      <Field id="code" label="Code" error={errors.code}>
        <Input
          id="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={7}
          placeholder="123456"
          className="h-12 max-w-48 text-center font-mono text-xl tracking-[0.4em] tabular-nums"
          aria-invalid={!!errors.code}
          {...form.register('code')}
        />
      </Field>
      <FormError message={errors.root?.message} />
      <Button type="submit" className="h-11 font-semibold" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {isSubmitting ? 'Checking…' : 'Turn on two-factor authentication'}
      </Button>
    </form>
  )
}
