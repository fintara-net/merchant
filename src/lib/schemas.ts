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
