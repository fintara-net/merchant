import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { Button } from './button'
import { Dialog } from './dialog'

interface TemporaryPasswordDialogProps {
  /** null hides the dialog */
  login: { username: string; password: string } | null
  onClose: () => void
}

/**
 * Shows a new login's first password once. The server keeps only its hash, so it can't be
 * shown again; the admin passes it on to the user.
 */
export function TemporaryPasswordDialog({ login, onClose }: TemporaryPasswordDialogProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!login) return
    try {
      await navigator.clipboard.writeText(login.password)
      setCopied(true)
    } catch {
      // Clipboard blocked: the password is still on screen to copy by hand
    }
  }

  const close = () => {
    setCopied(false)
    onClose()
  }

  return (
    <Dialog
      open={login !== null}
      onClose={close}
      title="Login created"
      description="Share this first password with the user. It won't be shown again."
    >
      {login && (
        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted">Username</dt>
            <dd className="font-medium">{login.username}</dd>
            <dt className="text-muted">Password</dt>
            <dd className="font-mono font-medium select-all">{login.password}</dd>
          </dl>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => void copy()}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? 'Copied' : 'Copy password'}
            </Button>
            <Button onClick={close}>Done</Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}
