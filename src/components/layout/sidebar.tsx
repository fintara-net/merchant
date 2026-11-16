import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { Logo } from '@/components/brand/logo'
import { BRAND } from '@/config/brand'
import { usePermissions } from '@/features/permissions'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/ui-store'
import { NAV_ITEMS } from './nav-items'

/**
 * Navy statement sidebar. The menu is a fixed list filtered by the user's permissions;
 * the current page is raised and its icon turns gold.
 */
export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const mobileOpen = useUiStore((s) => s.mobileNavOpen)
  const setMobileOpen = useUiStore((s) => s.setMobileNavOpen)
  const { can } = usePermissions()
  const items = NAV_ITEMS.filter((item) => can(item.permission))

  // Escape closes the phone drawer
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen, setMobileOpen])

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy text-on-navy transition-[width,translate] duration-200',
          'lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed && 'lg:w-16',
        )}
      >
        <div
          className={cn(
            'flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-5',
            collapsed && 'lg:justify-center lg:px-0',
          )}
        >
          <Link to="/" onClick={() => setMobileOpen(false)} className="rounded-sm">
            <Logo className={cn(collapsed && 'lg:hidden')} />
            {collapsed && <Logo compact className="hidden lg:inline-flex" />}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="grid size-8 place-items-center rounded-md text-on-navy-muted hover:bg-white/10 hover:text-on-navy lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2.5">
          {items.map(({ to, label, icon: Icon }) => (
            <Link
              key={label}
              to={to}
              title={collapsed ? label : undefined}
              onClick={() => setMobileOpen(false)}
              activeOptions={{ exact: to === '/' }}
              className={cn(
                'group flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-on-navy-muted transition-colors',
                'hover:bg-white/8 hover:text-on-navy',
                'data-[status=active]:bg-navy-raised data-[status=active]:font-semibold data-[status=active]:text-on-navy',
                collapsed && 'lg:justify-center lg:px-0',
              )}
            >
              <Icon
                aria-hidden
                className="size-4.5 shrink-0 group-data-[status=active]:text-gold"
              />
              <span className={cn(collapsed && 'lg:sr-only')}>{label}</span>
            </Link>
          ))}
        </nav>

        <p
          className={cn(
            'shrink-0 border-t border-white/10 px-5 py-3 text-xs text-on-navy-muted',
            collapsed && 'lg:hidden',
          )}
        >
          Powered by {BRAND.poweredBy}
        </p>
      </aside>

      {mobileOpen && (
        <div
          aria-hidden
          className="fixed inset-0 z-30 bg-[rgb(20_25_42/0.45)] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
