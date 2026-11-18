import { createFileRoute, Link } from '@tanstack/react-router'
import { ShieldX } from 'lucide-react'
import { Page } from '@/components/layout/page'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/table'

export const Route = createFileRoute('/_app/forbidden')({
  component: () => (
    <Page title="No access">
      <EmptyState
        icon={<ShieldX />}
        title="You don't have access to this page"
        description="Ask your administrator to add it to your role if you need it for your work."
        action={
          <Link to="/" className={buttonVariants({ variant: 'outline' })}>
            Back to the dashboard
          </Link>
        }
      />
    </Page>
  ),
})
