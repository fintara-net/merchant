import { z } from 'zod'

export const ISSUING_BANK_STATUSES = ['active', 'inactive'] as const
export type IssuingBankStatus = (typeof ISSUING_BANK_STATUSES)[number]

export const issuingBankSchema = z.object({
  id: z.string(),
  name: z.string(),
  swiftCode: z.string(),
  status: z.enum(ISSUING_BANK_STATUSES),
})
export type IssuingBank = z.infer<typeof issuingBankSchema>

/** SWIFT/BIC: 4 bank + 2 country letters, 2 location chars, optional 3 branch chars */
export const SWIFT_CODE_PATTERN = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/

export const issuingBankFormSchema = z.object({
  name: z.string().trim().min(2, 'Bank name is required').max(100, 'Bank name is too long'),
  swiftCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(SWIFT_CODE_PATTERN, 'Enter a valid 8 or 11 character SWIFT code'),
  status: z.enum(ISSUING_BANK_STATUSES),
})
export type IssuingBankFormInput = z.input<typeof issuingBankFormSchema>
export type IssuingBankFormValues = z.output<typeof issuingBankFormSchema>
