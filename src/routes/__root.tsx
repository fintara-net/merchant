import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { Logo } from '@/components/brand/logo'
import { BrandWave } from '@/components/brand/wave'
import { buttonVariants } from '@/components/ui/button'

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
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  ),
  notFoundComponent: () => (
    <div className="relative isolate grid min-h-dvh place-items-center overflow-hidden bg-brand-black p-6 text-center text-white">
      <BrandWave className="absolute inset-0 -z-10 size-full opacity-70" />
      <div>
        <Logo className="justify-center" />
        <h1 className="mt-10 text-7xl font-extrabold tracking-tight text-brand-400">404</h1>
        <p className="mt-3 text-white/70">This page doesn't exist.</p>
        <Link to="/" className={buttonVariants({ className: 'mt-8' })}>
          Back to dashboard
        </Link>
      </div>
    </div>
  ),
})
