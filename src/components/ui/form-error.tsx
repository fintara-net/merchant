/** A form-wide error, e.g. "Can't reach the server". Field errors show under their inputs. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="rounded-md border border-danger/25 bg-danger-soft px-3 py-2.5 text-sm text-danger"
    >
      {message}
    </p>
  )
}
