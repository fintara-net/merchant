import { z } from 'zod'
import { env } from './env'

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

/** The server could not be reached at all (offline, backend down, DNS…). */
export class NetworkError extends Error {
  constructor() {
    super("Can't reach the server. Check your connection and try again.")
    this.name = 'NetworkError'
  }
}

type QueryParams = Record<string, string | number | boolean | null | undefined>

interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  query?: QueryParams
  body?: unknown
}

/*
 * Session handling
 * - The access token (15 min) is kept only in this module's memory, never in storage.
 * - The refresh token lives in an httpOnly cookie that scripts can't read; the browser
 *   sends it only to /auth endpoints. Calling /auth/refresh swaps it for a new pair.
 */
const tokenResponseSchema = z.object({ accessToken: z.string(), expiresAt: z.string() })
export type TokenResponse = z.infer<typeof tokenResponseSchema>

let accessToken: string | null = null
let accessTokenExpiresAt = 0
let refreshInFlight: Promise<void> | null = null

// Refresh a little early so a request never leaves with a token about to expire
const EXPIRY_MARGIN_MS = 30_000

export function setSession(tokens: TokenResponse) {
  accessToken = tokens.accessToken
  accessTokenExpiresAt = Date.parse(tokens.expiresAt)
}

export function clearSession() {
  accessToken = null
  accessTokenExpiresAt = 0
}

const hasFreshToken = () =>
  accessToken !== null && Date.now() < accessTokenExpiresAt - EXPIRY_MARGIN_MS

async function requestRefresh() {
  const res = await send('POST', '/auth/refresh', {})
  if (!res.ok) throw await toApiError(res)
  setSession(tokenResponseSchema.parse(await res.json()))
}

/**
 * Gets a new access token using the refresh cookie. Parallel callers share one request.
 * One retry covers two tabs refreshing at the same moment: the slower tab sent the old
 * cookie, and by the retry the browser holds the new one.
 */
export function refreshSession(): Promise<void> {
  refreshInFlight ??= (async () => {
    try {
      await requestRefresh()
    } catch (error) {
      if (!isUnauthorized(error)) throw error
      await new Promise((r) => setTimeout(r, 300))
      await requestRefresh()
    }
  })()
    .catch((error: unknown) => {
      clearSession()
      throw error
    })
    .finally(() => {
      refreshInFlight = null
    })
  return refreshInFlight
}

/** Makes sure there is a usable access token, refreshing if needed. Throws 401 when signed out. */
export async function ensureSession() {
  if (!hasFreshToken()) await refreshSession()
}

function buildUrl(path: string, query?: QueryParams) {
  const url = new URL(`${env.VITE_API_BASE_URL}${path}`, window.location.origin)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }
  return url
}

async function send(
  method: string,
  path: string,
  { query, body, headers, ...init }: RequestOptions,
): Promise<Response> {
  try {
    return await fetch(buildUrl(path, query), {
      ...init,
      method,
      // Needed so the browser stores and sends the refresh cookie
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new NetworkError()
  }
}

async function readBody(res: Response): Promise<unknown> {
  return res.status === 204 ? undefined : await res.json().catch(() => undefined)
}

async function toApiError(res: Response) {
  const data = await readBody(res)
  const message =
    (data as { message?: string } | undefined)?.message ?? `Request failed (${res.status})`
  return new ApiError(res.status, message, data)
}

const isAuthPath = (path: string) => path.startsWith('/auth/')

async function request<T>(
  method: string,
  path: string,
  schema: z.ZodType<T> | null,
  opts: RequestOptions = {},
): Promise<T> {
  // Sign-in endpoints use the cookie; everything else needs an access token
  if (!isAuthPath(path) && !hasFreshToken() && accessToken !== null) {
    await refreshSession().catch(() => undefined)
  }

  let res = await send(method, path, opts)

  // Token expired or was revoked mid-request: refresh once and retry
  if (res.status === 401 && !isAuthPath(path) && accessToken !== null) {
    await refreshSession().catch(() => undefined)
    if (accessToken !== null) res = await send(method, path, opts)
  }

  if (!res.ok) throw await toApiError(res)

  const data = await readBody(res)
  // Validate every response at runtime so bad backend data can't silently reach the UI
  return schema ? schema.parse(data) : (data as T)
}

export const api = {
  get: <T>(path: string, schema: z.ZodType<T>, opts?: RequestOptions) =>
    request('GET', path, schema, opts),
  post: <T>(path: string, schema: z.ZodType<T> | null, opts?: RequestOptions) =>
    request('POST', path, schema, opts),
  put: <T>(path: string, schema: z.ZodType<T> | null, opts?: RequestOptions) =>
    request('PUT', path, schema, opts),
  patch: <T>(path: string, schema: z.ZodType<T> | null, opts?: RequestOptions) =>
    request('PATCH', path, schema, opts),
  delete: <T>(path: string, schema: z.ZodType<T> | null, opts?: RequestOptions) =>
    request('DELETE', path, schema, opts),
}

export { tokenResponseSchema }

export const isUnauthorized = (e: unknown) => e instanceof ApiError && e.status === 401
