/** A form-wide error, e.g. "Can't reach the server". Field errors show under their inputs. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
      {message}
    </p>
  )
}
