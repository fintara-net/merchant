/**
 * Dev-only mock API so the UI works before the backend exists.
 * Sign in with any email + password "password".
 * Use viewer@fintara.test to see a read-only permission set.
 */
import { http, HttpResponse } from 'msw'
import { env } from '@/lib/env'
import { PERMISSIONS } from '@/features/permissions/permissions'

const base = env.VITE_API_BASE_URL
const SESSION_KEY = 'mock-session-email'

const banks = [
  'Northwind Bank',
  'Contoso Bank',
  'Globex Finance',
  'Initech Credit',
  'Umbrella Bank',
]
const statuses = ['completed', 'completed', 'completed', 'pending', 'failed', 'reversed'] as const

const transactions = Array.from({ length: 137 }, (_, i) => ({
  id: `txn_${i + 1}`,
  reference: `TXN-${String(100000 + i)}`,
  amount: ((i * 7919) % 500000) + 500,
  currency: 'USD',
  status: statuses[i % statuses.length]!,
  issuingBankName: banks[i % banks.length]!,
  createdAt: new Date(Date.now() - i * 3_600_000).toISOString(),
}))

const users = [
  { id: 'u1', name: 'Ada Admin', email: 'admin@fintara.test', role: 'admin', status: 'active' },
  {
    id: 'u2',
    name: 'Victor Viewer',
    email: 'viewer@fintara.test',
    role: 'viewer',
    status: 'active',
  },
  { id: 'u3', name: 'Olive Ops', email: 'ops@fintara.test', role: 'operations', status: 'invited' },
  { id: 'u4', name: 'Dan Former', email: 'dan@fintara.test', role: 'viewer', status: 'disabled' },
] as const

const permissionsFor = (email: string) =>
  email.startsWith('viewer')
    ? [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.TRANSACTIONS_READ, PERMISSIONS.ISSUING_BANKS_READ]
    : Object.values(PERMISSIONS)

const sessionUser = () => {
  const email = sessionStorage.getItem(SESSION_KEY)
  if (!email) return null
  const name = email.split('@')[0]!.replace(/^\w/, (c) => c.toUpperCase())
  return {
    id: 'me',
    name: `${name} User`,
    email,
    role: email.startsWith('viewer') ? 'viewer' : 'admin',
  }
}

const unauthorized = () => HttpResponse.json({ message: 'Not signed in' }, { status: 401 })

function paginate<T>(items: readonly T[], url: URL) {
  const page = Number(url.searchParams.get('page') ?? 1)
  const pageSize = Number(url.searchParams.get('pageSize') ?? 20)
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: items.length,
  }
}

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
    return user ? HttpResponse.json({ permissions: permissionsFor(user.email) }) : unauthorized()
  }),

  http.get(`${base}/transactions`, ({ request }) => {
    if (!sessionUser()) return unauthorized()
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const filtered = status ? transactions.filter((t) => t.status === status) : transactions
    return HttpResponse.json(paginate(filtered, url))
  }),

  http.get(`${base}/users`, ({ request }) =>
    sessionUser() ? HttpResponse.json(paginate(users, new URL(request.url))) : unauthorized(),
  ),
]
