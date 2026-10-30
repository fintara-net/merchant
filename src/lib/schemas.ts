import { z } from 'zod'

export const paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  })

export type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number }

/** Shared search-param schema for paginated list routes */
export const listSearchSchema = z.object({
  page: z.number().int().positive().optional(),
  q: z.string().optional(),
})

// ── Shared form fields, so every form validates the same way ──

export const usernameField = z
  .string()
  .trim()
  .min(3, 'At least 3 characters')
  .max(50, 'At most 50 characters')
  .regex(/^[A-Za-z0-9._-]+$/, 'Letters, numbers, dot, dash and underscore only')

export const personNameField = (label: string) =>
  z.string().trim().min(1, `${label} is required`).max(50, 'At most 50 characters')

/** Nepal mobile number: 10 digits starting with 9 */
export const phoneField = z
  .string()
  .trim()
  .regex(/^9\d{9}$/, 'Enter a 10-digit mobile number starting with 9')

export const emailField = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email'))
