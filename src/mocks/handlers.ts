/**
 * Dev-only mock API so the UI works before the backend exists.
 * Sign in with any email + password "password". The start of the email picks the account:
 * - bank@...      bank user of Nabil Bank (sees only Transactions)
 * - merchant@...  merchant user of Himalayan Electronics (sees only Transactions)
 * - viewer@...    read-only super admin
 * - anything else full super admin
 */
import { http, HttpResponse } from 'msw'
import { env } from '@/lib/env'
import { PERMISSIONS } from '@/features/permissions/permissions'

const base = env.VITE_API_BASE_URL
const SESSION_KEY = 'mock-session-email'

type MockAccount = 'bank' | 'merchant' | 'viewer' | 'admin'

const accountFor = (email: string): MockAccount =>
  email.startsWith('bank')
    ? 'bank'
    : email.startsWith('merchant')
      ? 'merchant'
      : email.startsWith('viewer')
        ? 'viewer'
        : 'admin'

const PERMISSIONS_BY_ACCOUNT: Record<MockAccount, string[]> = {
  admin: Object.values(PERMISSIONS),
  viewer: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.TRANSACTIONS_READ,
    PERMISSIONS.ISSUING_BANKS_READ,
    PERMISSIONS.MERCHANTS_READ,
  ],
  // Banks and merchants only get their own transactions
  bank: [PERMISSIONS.TRANSACTIONS_READ, PERMISSIONS.TRANSACTIONS_EXPORT],
  merchant: [PERMISSIONS.TRANSACTIONS_READ, PERMISSIONS.TRANSACTIONS_EXPORT],
}

// Ids match the sample data in features/issuing-banks/store.ts and features/merchants/store.ts
const ORGANISATION_BY_ACCOUNT: Record<MockAccount, { id: string; name: string } | null> = {
  admin: null,
  viewer: null,
  bank: { id: 'bank_1', name: 'Nabil Bank Limited' },
  merchant: { id: 'mer_1', name: 'Himalayan Electronics' },
}

const sessionUser = () => {
  const email = sessionStorage.getItem(SESSION_KEY)
  if (!email) return null
  const name = email.split('@')[0]!.replace(/^\w/, (c) => c.toUpperCase())
  const account = accountFor(email)
  return {
    id: 'me',
    name: `${name} User`,
    email,
    role: account,
    userType: account === 'bank' || account === 'merchant' ? account : 'super-admin',
    organisation: ORGANISATION_BY_ACCOUNT[account],
  }
}

const unauthorized = () => HttpResponse.json({ message: 'Not signed in' }, { status: 401 })

export const handlers = [
  http.post(`${base}/auth/login`, async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string }
    if (password !== 'password') {
      return HttpResponse.json({ message: 'Invalid email or password' }, { status: 401 })
    }
    sessionStorage.setItem(SESSION_KEY, email)
    return HttpResponse.json(sessionUser())
  }),

  http.post(`${base}/auth/logout`, () => {
    sessionStorage.removeItem(SESSION_KEY)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${base}/auth/me`, () => {
    const user = sessionUser()
    return user ? HttpResponse.json(user) : unauthorized()
  }),

  http.get(`${base}/me/permissions`, () => {
    const user = sessionUser()
    return user
      ? HttpResponse.json({ permissions: PERMISSIONS_BY_ACCOUNT[accountFor(user.email)] })
      : unauthorized()
  }),
]
