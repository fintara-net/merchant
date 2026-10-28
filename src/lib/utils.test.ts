import { describe, expect, it } from 'vitest'
import { safeRedirect } from './utils'

describe('safeRedirect', () => {
  it('allows relative paths', () => expect(safeRedirect('/users?page=2')).toBe('/users?page=2'))
  it('blocks external and protocol-relative URLs', () => {
    expect(safeRedirect('https://evil.com')).toBe('/')
    expect(safeRedirect('//evil.com')).toBe('/')
    expect(safeRedirect('/\\evil.com')).toBe('/')
  })
  it('falls back when empty', () => expect(safeRedirect(undefined)).toBe('/'))
})
