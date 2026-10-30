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

const permissionsFor = (email: string) =>
  email.startsWith('viewer')
    ? [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.TRANSACTIONS_READ,
        PERMISSIONS.ISSUING_BANKS_READ,
        PERMISSIONS.MERCHANTS_READ,
      ]
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
]
