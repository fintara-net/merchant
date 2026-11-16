import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { Logo } from '@/components/brand/logo'
import { buttonVariants } from '@/components/ui/button'
import { Toaster } from '@/components/ui/toast'

export interface RouterContext {
  queryClient: QueryClient
}

// Devtools are only bundled in development
const Devtools = import.meta.env.DEV
  ? lazy(async () => {
      const [{ TanStackRouterDevtools }, { ReactQueryDevtools }] = await Promise.all([
        import('@tanstack/react-router-devtools'),
        import('@tanstack/react-query-devtools'),
      ])
      return {
        default: () => (
          <>
            <TanStackRouterDevtools position="bottom-right" />
            <ReactQueryDevtools buttonPosition="bottom-left" />
          </>
        ),
      }
    })
  : () => null

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
      <Toaster />
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-14 items-center bg-navy px-6">
        <Link to="/" className="rounded-sm">
          <Logo />
        </Link>
      </header>
      <main className="grid flex-1 place-items-center p-6">
        <div className="w-full max-w-md rounded-lg border border-border bg-surface px-6 py-8 text-center">
          <p className="text-sm font-semibold text-muted">Error 404</p>
          <h1 className="mt-1 text-2xl font-semibold">This page doesn't exist</h1>
          <p className="mt-2 text-sm text-muted">
            The link may be old or mistyped. Check the address, or go back to the dashboard.
          </p>
          <Link to="/" className={buttonVariants({ className: 'mt-6' })}>
            Back to the dashboard
          </Link>
        </div>
      </main>
    </div>
  ),
})
