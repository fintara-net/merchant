import { Check, Copy, Download } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { BRAND } from '@/config/brand'

interface RecoveryCodesProps {
  codes: string[]
  accountName: string
  onDone: () => void
  doneLabel?: string
}

/**
 * The recovery codes, shown once. The server keeps only hashes, so the user must save them
 * now; "Continue" stays off until they confirm they have.
 */
export function RecoveryCodes({
  codes,
  accountName,
  onDone,
  doneLabel = 'Continue',
}: RecoveryCodesProps) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const checkboxId = useId()

  const text = [
    `${BRAND.name} recovery codes for ${accountName}`,
    'Each code signs you in once if you can’t use your authenticator app.',
    '',
    ...codes,
    '',
  ].join('\n')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      // Clipboard blocked: the codes are still on screen and can be downloaded
    }
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${BRAND.name.toLowerCase()}-recovery-codes.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-5">
      <ul
        aria-label="Recovery codes"
        className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl border bg-background p-4 font-mono text-sm tracking-wider select-all"
      >
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void copy()}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? 'Copied' : 'Copy codes'}
        </Button>
        <Button variant="outline" onClick={download}>
          <Download className="size-4" /> Download
        </Button>
      </div>

      <label htmlFor={checkboxId} className="flex items-start gap-2.5 text-sm">
        <Checkbox
          id={checkboxId}
          className="mt-0.5"
          checked={saved}
          onChange={(e) => setSaved(e.target.checked)}
        />
        I&apos;ve saved these codes somewhere safe, like a password manager.
      </label>

      <Button className="h-11 font-semibold" disabled={!saved} onClick={onDone}>
        {doneLabel}
      </Button>
    </div>
  )
}
