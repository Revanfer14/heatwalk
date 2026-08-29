import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useAppState } from '@/hooks/useAppState'
import { useSchoolMeta } from '@/hooks/useSchoolMeta'
import { ABOUT_SECTIONS } from '@/lib/aboutContent'
import { formatDose, formatTemperaturePair } from '@/lib/units'

export default function AboutDialog() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { schools } = useAppState()
  const firstSchoolId = schools[0]?.id ?? null
  const { meta } = useSchoolMeta(open ? firstSchoolId : null)

  const goToDoc = (path: string): void => {
    setOpen(false)
    navigate(path)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="About HeatWalk">
          <Info strokeWidth={1.5} size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-[min(90vw,36rem)] overflow-y-auto sm:max-w-[36rem]">
        <DialogHeader>
          <DialogTitle className="text-[1.125rem] font-semibold tracking-tight text-ink">About HeatWalk</DialogTitle>
          <DialogDescription>
            Why cumulative heat dose replaces distance as the walk-zone impedance function.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          {ABOUT_SECTIONS.map((section) => (
            <section key={section.id} className="flex flex-col gap-1.5">
              <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-subtle">{section.title}</h3>
              <p className="text-sm text-ink-muted">{section.body}</p>
            </section>
          ))}
          {meta !== null && (
            <p className="text-xs text-ink-subtle">
              Baseline {formatTemperaturePair(meta.baseline_c)} · threshold {formatDose(meta.threshold)}, read live
              from {schools[0]?.name ?? 'the first analyzed school'}.
            </p>
          )}
        </div>
        <Separator />
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => goToDoc('/methodology')}>
            Methodology
          </Button>
          <Button variant="ghost" onClick={() => goToDoc('/limitations')}>
            Limitations
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
