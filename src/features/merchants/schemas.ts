import { z } from 'zod'
import { emailField, personNameField, phoneField, usernameField } from '@/lib/schemas'

export const MERCHANT_STATUSES = ['active', 'inactive'] as const
export type MerchantStatus = (typeof MERCHANT_STATUSES)[number]

export const merchantSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Our own merchant ID, e.g. "MER00012" */
  merchantCode: z.string(),
  /** Nepal PAN/VAT registration number */
  panNumber: z.string(),
  phoneNumber: z.string(),
  email: z.string(),
  status: z.enum(MERCHANT_STATUSES),
  /** The merchant's first login; null if it has none */
  loginUsername: z.string().nullable(),
})
export type Merchant = z.infer<typeof merchantSchema>

export const merchantFormSchema = z.object({
  name: z.string().trim().min(2, 'Merchant name is required').max(100, 'Merchant name is too long'),
  merchantCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{3,15}$/, 'Use 3–15 letters or numbers'),
  panNumber: z
    .string()
    .trim()
    .regex(/^\d{9}$/, 'PAN number must be 9 digits'),
  phoneNumber: phoneField,
  email: emailField,
  status: z.enum(MERCHANT_STATUSES),
})
export type MerchantFormInput = z.input<typeof merchantFormSchema>
export type MerchantFormValues = z.output<typeof merchantFormSchema>

/**
 * The merchant's login, created together with the merchant. It uses the
 * merchant's email and phone. After creation it's managed on the Users page.
 */
export const merchantLoginSchema = z.object({
  username: usernameField,
  firstName: personNameField('First name'),
  lastName: personNameField('Last name'),
})
export type MerchantLoginValues = z.output<typeof merchantLoginSchema>

/** Adding a merchant = business details + its first login */
export const merchantCreateFormSchema = merchantFormSchema.extend({ login: merchantLoginSchema })
export type MerchantCreateFormInput = z.input<typeof merchantCreateFormSchema>
export type MerchantCreateFormValues = z.output<typeof merchantCreateFormSchema>
