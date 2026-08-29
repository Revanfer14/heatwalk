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
import { ABOUT_SECTIONS } from '@/lib/aboutContent'

export default function AboutDialog() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

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
            <section key={section.id} className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-subtle">{section.title}</h3>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm text-ink-muted">{paragraph}</p>
              ))}
            </section>
          ))}
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
