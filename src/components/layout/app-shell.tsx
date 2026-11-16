import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { ChevronRight, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sessionQueryOptions } from '@/features/auth/api'
import { useUiStore } from '@/stores/ui-store'
import { pageLabel } from './nav-items'
import { Sidebar } from './sidebar'
import { UserMenu } from './user-menu'

export function AppShell() {
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen)
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  return (
    <div className="flex min-h-dvh">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileNavOpen(true)}
            className="-ml-1 lg:hidden"
          >
            <Menu />
            <span className="sr-only">Open menu</span>
          </Button>
          {/* Desktop: shrink the sidebar to icons and back. Kept up here so it is always reachable. */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebar}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand menu' : 'Collapse menu'}
            className="-ml-1 hidden lg:inline-flex"
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            <span className="sr-only">{collapsed ? 'Expand menu' : 'Collapse menu'}</span>
          </Button>
          <Breadcrumb />
          <div className="ml-auto flex items-center gap-4">
            <ScopeLabel />
            <UserMenu />
          </div>
        </header>

        <main className="w-full flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function Breadcrumb() {
  const { pathname } = useLocation()
  const current = pageLabel(pathname)
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm">
        <li className="hidden sm:block">
          <Link to="/" className="text-muted hover:text-foreground hover:underline">
            Dashboard
          </Link>
        </li>
        <li aria-hidden className="hidden text-muted sm:block">
          <ChevronRight className="size-3.5" />
        </li>
        <li aria-current="page" className="truncate font-semibold">
          {current}
        </li>
      </ol>
    </nav>
  )
}

/** Whose data this user sees, always in view so nobody has to wonder. */
function ScopeLabel() {
  const { data: user } = useSuspenseQuery(sessionQueryOptions)
  const scope = user.organisation?.name ?? 'All banks and merchants'
  return (
    <p className="hidden items-center gap-2 rounded-md border border-border bg-surface-sunken px-2.5 py-1 text-sm md:flex">
      <span className="text-muted">Viewing</span>
      <span className="max-w-56 truncate font-semibold">{scope}</span>
    </p>
  )
}
