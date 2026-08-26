import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DocPageShellProps {
  eyebrow: string
  title: string
  children: ReactNode
}

export default function DocPageShell({ eyebrow, title, children }: DocPageShellProps) {
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-bg pt-12">
      <div className="mx-auto flex max-w-[70ch] flex-col gap-8 px-4 py-10">
        <div className="flex flex-col gap-3">
          <Button
            variant="ghost"
            className="w-fit gap-1.5 px-2 text-ink-muted"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft strokeWidth={1.5} size={16} />
            Back
          </Button>
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-subtle">{eyebrow}</span>
          <h1 className="text-balance text-[1.75rem] font-semibold tracking-tight text-ink">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  )
}
