import { Link } from '@tanstack/react-router'
import { Logo } from '@/components/brand/logo'
import { BRAND } from '@/config/brand'
import { usePermissions } from '@/features/permissions'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/ui-store'
import { NAV_ITEMS } from './nav-items'

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const mobileOpen = useUiStore((s) => s.mobileNavOpen)
  const setMobileOpen = useUiStore((s) => s.setMobileNavOpen)
  const { can } = usePermissions()
  const items = NAV_ITEMS.filter((item) => can(item.permission))

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-68 flex-col border-r bg-surface transition-[width,translate] duration-200',
          'lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed && 'lg:w-20',
        )}
      >
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b px-6',
            collapsed && 'lg:justify-center lg:px-0',
          )}
        >
          <Link to="/" onClick={() => setMobileOpen(false)} className="rounded-lg">
            <Logo className={cn('text-lg', collapsed && 'lg:hidden')} />
            {collapsed && <Logo compact className="hidden lg:inline-flex" />}
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {items.map(({ to, label, icon: Icon }) => (
            <Link
              key={label}
              to={to}
              title={collapsed ? label : undefined}
              onClick={() => setMobileOpen(false)}
              activeOptions={{ exact: to === '/' }}
              className={cn(
                'flex items-center gap-3 rounded-lg border-l-3 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition-colors',
                'hover:bg-accent hover:text-foreground',
                'data-[status=active]:border-primary data-[status=active]:bg-primary/10 data-[status=active]:font-semibold data-[status=active]:text-primary',
                collapsed && 'lg:justify-center lg:px-0',
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              <span className={cn(collapsed && 'lg:sr-only')}>{label}</span>
            </Link>
          ))}
        </nav>

        <p
          className={cn(
            'shrink-0 border-t px-4 py-4 text-center text-xs text-muted',
            collapsed && 'lg:hidden',
          )}
        >
          Powered by <span className="font-semibold text-primary">{BRAND.poweredBy}</span>
        </p>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
