import { createRouter } from '@tanstack/react-router'
import { createQueryClient } from '@/lib/query-client'
import { routeTree } from './routeTree.gen'

export const queryClient = createQueryClient(() => {
  // Session expired mid-use: clear cached data and send the user to sign in
  const { pathname, href } = router.state.location
  if (pathname === '/login') return
  queryClient.clear()
  void router.navigate({ to: '/login', search: { redirect: href } })
})

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  // Let TanStack Query own caching; the router always calls loaders
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  defaultPendingComponent: () => (
    <div className="grid place-items-center gap-3 py-24 text-sm text-muted">
      <span className="size-8 animate-spin rounded-full border-3 border-primary/20 border-t-primary" />
      Loading…
    </div>
  ),
  defaultErrorComponent: ({ error }) => (
    <div role="alert" className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-sm">
      <p className="font-semibold text-danger">Something went wrong</p>
      <p className="mt-1 text-muted">
        {error instanceof Error ? error.message : 'Unexpected error'}
      </p>
    </div>
  ),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
