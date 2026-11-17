import { createRouter } from '@tanstack/react-router'
import { CircleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createQueryClient } from '@/lib/query-client'
import { routeTree } from './routeTree.gen'

export const queryClient = createQueryClient(() => {
  // Session expired mid-use: clear cached data and send the user to sign in
  const { pathname, href } = router.state.location
  if (pathname === '/login') return
  queryClient.clear()
  void router.navigate({ to: '/login', search: { redirect: href, expired: true } })
})

export const router = createRouter({
  routeTree,
  // Where the app is served (BASE_PATH at build time, e.g. /merchant/); links and
  // redirects stay relative to it
  basepath: import.meta.env.BASE_URL,
  context: { queryClient },
  defaultPreload: 'intent',
  // Let TanStack Query own caching; the router always calls loaders
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  defaultPendingComponent: () => (
    <div className="grid place-items-center gap-3 py-24 text-sm text-muted">
      <span className="size-7 animate-spin rounded-full border-3 border-primary-soft-border border-t-primary" />
      Loading…
    </div>
  ),
  defaultErrorComponent: ({ error, reset }) => (
    <div className="grid place-items-center py-16">
      <div
        role="alert"
        className="w-full max-w-md rounded-lg border border-border bg-surface px-6 py-8 text-center"
      >
        <span className="mx-auto grid size-10 place-items-center rounded-md bg-danger-soft text-danger">
          <CircleAlert className="size-5" />
        </span>
        <h1 className="mt-3 text-xl font-semibold">This page couldn&apos;t load</h1>
        <p className="mt-1 text-sm text-muted">
          Try again. If it keeps happening, reload the page or contact your administrator.
        </p>
        {import.meta.env.DEV && error instanceof Error && (
          <p className="mt-3 rounded-md bg-surface-sunken px-3 py-2 text-left font-mono text-xs break-words text-muted">
            {error.message}
          </p>
        )}
        <div className="mt-5 flex justify-center gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload page
          </Button>
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </div>
  ),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
