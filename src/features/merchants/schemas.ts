import { z } from 'zod'

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
  phoneNumber: z
    .string()
    .trim()
    .regex(/^9\d{9}$/, 'Enter a 10-digit mobile number starting with 9'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  status: z.enum(MERCHANT_STATUSES),
})
export type MerchantFormInput = z.input<typeof merchantFormSchema>
export type MerchantFormValues = z.output<typeof merchantFormSchema>
