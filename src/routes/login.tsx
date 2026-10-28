import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Logo } from '@/components/brand/logo'
import { BrandWave } from '@/components/brand/wave'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { BRAND } from '@/config/brand'
import {
  authKeys,
  login,
  loginSchema,
  sessionQueryOptions,
  type LoginInput,
} from '@/features/auth/api'
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
          <LoginForm />
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

function LoginForm() {
  const { redirect } = Route.useSearch()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      // Drop any data from a previous session, then seed the new one
      queryClient.removeQueries({ queryKey: authKeys.all })
      queryClient.setQueryData(sessionQueryOptions.queryKey, user)
      router.history.push(safeRedirect(redirect))
    },
  })

  const { errors } = form.formState

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
      <p className="mt-1.5 text-sm text-muted">Sign in to your {BRAND.name} account to continue.</p>

      <form
        noValidate
        className="mt-8 flex flex-col gap-5"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="you@company.com"
            className="h-11"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...form.register('email')}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-danger">
              {errors.email.message}
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
            {mutation.error.message}
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
