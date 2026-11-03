import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError, NetworkError } from './api-client'

/** What a failed save means for a form: messages per field, and/or one for the whole form. */
export interface FormErrors {
  fields: Record<string, string>
  root?: string
}

/**
 * Reads the backend's `{ message, errors: { field: message } }` error shape.
 * Field names match the form's (e.g. "swiftCode", "login.username").
 */
export function formErrorsFrom(error: unknown): FormErrors {
  if (error instanceof NetworkError) return { fields: {}, root: error.message }
  if (error instanceof ApiError) {
    const body = error.body as { errors?: Record<string, string> } | undefined
    const fields = body?.errors && typeof body.errors === 'object' ? body.errors : {}
    if (Object.keys(fields).length > 0) return { fields }
    if (error.status === 403) return { fields: {}, root: "You don't have permission to do this." }
    return { fields: {}, root: error.message }
  }
  return { fields: {}, root: 'Something went wrong. Please try again.' }
}

/** Puts server errors on a react-hook-form form: each under its field, the rest on `root`. */
export function applyFormErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  errors: FormErrors,
) {
  for (const [field, message] of Object.entries(errors.fields)) {
    setError(field as Path<T>, { message })
  }
  if (errors.root) setError('root', { message: errors.root })
}
