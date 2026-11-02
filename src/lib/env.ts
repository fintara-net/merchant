import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1),
})

/** Validated at startup — the app fails fast if env is misconfigured. */
export const env = envSchema.parse(import.meta.env)
