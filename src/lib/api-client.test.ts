import { z } from 'zod'
import {
  api,
  ApiError,
  clearSession,
  ensureSession,
  NetworkError,
  refreshSession,
  setSession,
} from './api-client'

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const tokens = (accessToken: string, minutes = 15) => ({
  accessToken,
  expiresAt: new Date(Date.now() + minutes * 60_000).toISOString(),
})

const authHeader = (call: unknown[]) =>
  new Headers((call[1] as RequestInit).headers).get('Authorization')

const path = (call: unknown[]) => new URL(String(call[0])).pathname

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  clearSession()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => vi.unstubAllGlobals())

describe('api client session handling', () => {
  it('sends the access token with requests', async () => {
    setSession(tokens('token-1'))
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }))

    await api.get('/me', z.object({ ok: z.boolean() }))

    expect(authHeader(fetchMock.mock.calls[0]!)).toBe('Bearer token-1')
  })

  it('refreshes once and retries when a request gets 401', async () => {
    setSession(tokens('old'))
    fetchMock
      .mockResolvedValueOnce(json(401, { message: 'expired' }))
      .mockResolvedValueOnce(json(200, tokens('new')))
      .mockResolvedValueOnce(json(200, { ok: true }))

    await api.get('/me', z.object({ ok: z.boolean() }))

    expect(fetchMock.mock.calls.map(path)).toEqual([
      '/api/v1/me',
      '/api/v1/auth/refresh',
      '/api/v1/me',
    ])
    expect(authHeader(fetchMock.mock.calls[2]!)).toBe('Bearer new')
  })

  it('shares one refresh between parallel callers', async () => {
    fetchMock.mockResolvedValue(json(200, tokens('new')))

    await Promise.all([refreshSession(), refreshSession(), ensureSession()])

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('refreshes before sending when the token is about to expire', async () => {
    setSession(tokens('old', 0.1))
    fetchMock
      .mockResolvedValueOnce(json(200, tokens('new')))
      .mockResolvedValueOnce(json(200, { ok: true }))

    await api.get('/me', z.object({ ok: z.boolean() }))

    expect(fetchMock.mock.calls.map(path)).toEqual(['/api/v1/auth/refresh', '/api/v1/me'])
  })

  it('reports 401 when the refresh cookie is no longer valid', async () => {
    vi.useFakeTimers()
    fetchMock.mockResolvedValue(json(401, { message: 'Invalid or expired refresh token.' }))

    const result = ensureSession().catch((e: unknown) => e)
    await vi.runAllTimersAsync()
    const error = await result

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(401)
    // Tried twice: the second attempt covers two tabs refreshing at once
    expect(fetchMock).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('turns a failed connection into a NetworkError', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(api.post('/auth/login', null, { body: {} })).rejects.toBeInstanceOf(NetworkError)
  })
})
