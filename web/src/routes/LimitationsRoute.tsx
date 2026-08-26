import DocPageShell from '@/components/DocPageShell'
import LimitationsAccordion from '@/components/limitations/LimitationsAccordion'
import { IMPLEMENTATION_LIMITATIONS, PRD_LIMITATIONS } from '@/lib/limitationsContent'

export default function LimitationsRoute() {
  return (
    <DocPageShell eyebrow="Honesty" title="Limitations">
      <p className="text-ink-muted">
        These are measurements, not a list of regrets buried in a footer. Small deltas, empty categories, and
        out-of-range calibration factors are reported here exactly as computed — this is what separates a product
        that measures from one that only claims.
      </p>
      <section className="flex flex-col gap-1">
        <h2 className="text-[1.125rem] font-semibold tracking-tight text-ink">Stated limitations</h2>
        <LimitationsAccordion entries={PRD_LIMITATIONS} numberOffset={0} />
      </section>
      <section className="flex flex-col gap-1">
        <h2 className="text-[1.125rem] font-semibold tracking-tight text-ink">
          Additional findings from implementation
        </h2>
        <p className="text-sm text-ink-muted">
          Found while building the pipeline, not originally on the required list above, and just as important to
          read before trusting a number in this product.
        </p>
        <LimitationsAccordion entries={IMPLEMENTATION_LIMITATIONS} numberOffset={PRD_LIMITATIONS.length} />
      </section>
    </DocPageShell>
  )
}
