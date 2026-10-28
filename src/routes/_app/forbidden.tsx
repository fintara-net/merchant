import { createFileRoute, Link } from '@tanstack/react-router'
import { ShieldX } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export const Route = createFileRoute('/_app/forbidden')({
  component: () => (
    <div className="grid place-items-center py-24 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
        <ShieldX className="size-8" />
      </span>
      <h1 className="mt-6 text-2xl font-bold">You don't have access to this page</h1>
      <p className="mt-2 text-sm text-muted">
        Ask an administrator if you think this is a mistake.
      </p>
      <Link to="/" className={buttonVariants({ className: 'mt-6' })}>
        Back to overview
      </Link>
    </div>
  ),
})
