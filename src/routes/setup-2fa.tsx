import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { Check, Copy, Loader2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Button } from '@/components/ui/button'
import { AuthHeading, AuthLayout } from '@/components/layout/auth-layout'
import { Field } from '@/components/ui/field'
import { FormError } from '@/components/ui/form-error'
import { Input } from '@/components/ui/input'
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
    <AuthLayout wide footer={recoveryCodes ? undefined : <SignOutLink />}>
      {recoveryCodes ? (
        <>
          <AuthHeading
            title="Save your recovery codes"
            description="Two-factor authentication is on. If you lose your phone, each of these codes signs you in once. They won't be shown again."
          />
          <RecoveryCodes
            codes={recoveryCodes}
            accountName={user.username}
            onDone={() => void finish()}
            doneLabel="Continue to the dashboard"
          />
        </>
      ) : (
        <>
          <AuthHeading
            title="Set up two-factor authentication"
            description="Every account signs in with a password and a code from an authenticator app, so a stolen password alone can't be used."
          />
          <SetupSteps onEnabled={setRecoveryCodes} />
        </>
      )}
    </AuthLayout>
  )
}

function SetupSteps({ onEnabled }: { onEnabled: (codes: string[]) => void }) {
  const setup = useQuery(twoFactorSetupQueryOptions)

  if (setup.isPending) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="size-4 animate-spin" /> Preparing your QR code…
      </p>
    )
  }
  if (setup.isError) {
    return (
      <div className="flex flex-col items-start gap-3">
        <FormError message={formErrorsFrom(setup.error).root ?? "Couldn't start setup."} />
        <Button variant="outline" onClick={() => void setup.refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <ol className="flex flex-col gap-6">
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
      <span className="grid size-6 place-items-center rounded-sm bg-navy text-xs font-semibold text-on-navy">
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
      <div className="self-start rounded-md border border-border bg-white p-3">
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
        <summary className="cursor-pointer font-medium text-primary underline-offset-4 hover:underline">
          Can&apos;t scan it? Enter a setup key instead
        </summary>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <code className="rounded-md border border-border bg-surface-sunken px-3 py-2 font-mono text-sm tracking-wider select-all">
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
          className="h-12 max-w-48 text-center text-xl font-semibold tracking-[0.4em]"
          aria-invalid={!!errors.code}
          {...form.register('code')}
        />
      </Field>
      <FormError message={errors.root?.message} />
      <Button type="submit" className="h-10 self-start" loading={isSubmitting}>
        {isSubmitting ? 'Checking…' : 'Turn on two-factor authentication'}
      </Button>
    </form>
  )
}
