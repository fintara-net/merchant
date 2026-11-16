import type { LinkProps } from '@tanstack/react-router'
import {
  ArrowLeftRight,
  Building2,
  LayoutDashboard,
  Store,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { PERMISSIONS, type Permission } from '@/features/permissions'

export interface NavItem {
  to: LinkProps['to'] & string
  label: string
  icon: LucideIcon
  permission: Permission
}

/** The fixed menu. The sidebar shows only the items the user has permission for. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW },
  {
    to: '/transactions',
    label: 'Transactions',
    icon: ArrowLeftRight,
    permission: PERMISSIONS.TRANSACTIONS_READ,
  },
  {
    to: '/issuing-banks',
    label: 'Issuing banks',
    icon: Building2,
    permission: PERMISSIONS.ISSUING_BANKS_READ,
  },
  { to: '/merchants', label: 'Merchants', icon: Store, permission: PERMISSIONS.MERCHANTS_READ },
  { to: '/users', label: 'User management', icon: Users, permission: PERMISSIONS.USERS_READ },
]

/** Pages that are reached from the user menu rather than the sidebar */
const OTHER_PAGES: Record<string, string> = {
  '/two-factor': 'Two-factor authentication',
  '/forbidden': 'No access',
}

/** Breadcrumb label for a path, e.g. /merchants → "Merchants". */
export function pageLabel(pathname: string) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (OTHER_PAGES[path]) return OTHER_PAGES[path]
  const item = NAV_ITEMS.find((i) =>
    i.to === '/' ? path === '/' : path === i.to || path.startsWith(`${i.to}/`),
  )
  return item?.label ?? 'Page not found'
}
