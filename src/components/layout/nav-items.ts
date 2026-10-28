import type { LinkProps } from '@tanstack/react-router'
import { ArrowLeftRight, Building2, LayoutDashboard, Users, type LucideIcon } from 'lucide-react'
import { PERMISSIONS, type Permission } from '@/features/permissions'

export interface NavItem {
  to: LinkProps['to']
  label: string
  icon: LucideIcon
  permission: Permission
}

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
  { to: '/users', label: 'User management', icon: Users, permission: PERMISSIONS.USERS_READ },
]
