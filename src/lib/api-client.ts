import type { z } from 'zod'
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

type QueryParams = Record<string, string | number | boolean | null | undefined>

interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  query?: QueryParams
  body?: unknown
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

async function request<T>(
  method: string,
  path: string,
  schema: z.ZodType<T> | null,
  { query, body, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const res = await fetch(buildUrl(path, query), {
    ...init,
    method,
    // Session lives in an httpOnly cookie set by the backend — never in JS-readable storage
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const data: unknown = res.status === 204 ? undefined : await res.json().catch(() => undefined)

  if (!res.ok) {
    const message =
      (data as { message?: string } | undefined)?.message ?? `Request failed (${res.status})`
    throw new ApiError(res.status, message, data)
  }

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

export const isUnauthorized = (e: unknown) => e instanceof ApiError && e.status === 401
