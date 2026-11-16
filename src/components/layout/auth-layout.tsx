import { LockKeyhole } from 'lucide-react'
import type { ReactNode } from 'react'
import { Logo } from '@/components/brand/logo'
import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'

interface AuthLayoutProps {
  children: ReactNode
  /** Under the form, e.g. a sign-out or back link */
  footer?: ReactNode
  /** Wider column for content like the 2FA setup steps */
  wide?: boolean
}

/**
 * Shared frame for sign-in and the security steps: a navy letterhead column on desktop
 * (a slim navy bar on phones) and the form on white.
 */
export function AuthLayout({ children, footer, wide = false }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="flex items-center bg-navy px-6 py-4 text-on-navy lg:flex-col lg:items-stretch lg:px-12 lg:py-12">
        <Logo />

        <div className="mt-auto hidden max-w-sm lg:block">
          <p className="text-2xl leading-snug font-semibold text-balance">
            Transactions and access for banks and merchants, in one statement.
          </p>
          <p className="mt-4 flex items-start gap-2.5 text-sm text-on-navy-muted">
            <LockKeyhole aria-hidden className="mt-0.5 size-4 shrink-0 text-gold" />
            Every account signs in with a password and a code from an authenticator app.
          </p>
        </div>

        <p className="mt-auto hidden border-t border-white/12 pt-5 text-xs text-on-navy-muted lg:block">
          {BRAND.productName}, powered by {BRAND.poweredBy}. © {new Date().getFullYear()}
        </p>
      </aside>

      <main className="flex flex-1 flex-col px-5 py-10 sm:px-10">
        <div className="flex flex-1 items-center justify-center">
          <div className={cn('w-full', wide ? 'max-w-lg' : 'max-w-sm')}>{children}</div>
        </div>
        {footer && <div className="mt-8 flex justify-center text-sm text-muted">{footer}</div>}
        <p className="mt-8 text-center text-xs text-muted lg:hidden">
          Powered by {BRAND.poweredBy}
        </p>
      </main>
    </div>
  )
}

/** Title block for auth screens. `step` shows where the user is in a multi-step flow. */
export function AuthHeading({
  title,
  description,
  step,
}: {
  title: string
  description?: ReactNode
  step?: string
}) {
  return (
    <div className="mb-7">
      {step && <p className="mb-2 text-sm font-medium text-muted">{step}</p>}
      <h1 className="text-2xl font-semibold text-balance">{title}</h1>
      {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
    </div>
  )
}
