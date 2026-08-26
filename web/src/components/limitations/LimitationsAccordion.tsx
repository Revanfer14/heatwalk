import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { LimitationEntry } from '@/lib/limitationsContent'

interface LimitationsAccordionProps {
  entries: LimitationEntry[]
  numberOffset: number
}

export default function LimitationsAccordion({ entries, numberOffset }: LimitationsAccordionProps) {
  return (
    <Accordion type="multiple">
      {entries.map((entry, index) => (
        <AccordionItem key={entry.id} value={entry.id}>
          <AccordionTrigger>
            <span className="tabular-nums text-ink-subtle">{numberOffset + index + 1}.</span>
            <span className="ml-2">{entry.title}</span>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-ink-muted">{entry.body}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
