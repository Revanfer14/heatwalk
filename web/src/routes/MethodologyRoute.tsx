import { Link } from 'react-router-dom'
import DocPageShell from '@/components/DocPageShell'
import MethodologyDoseFormula from '@/components/methodology/MethodologyDoseFormula'
import MethodologyParameters from '@/components/methodology/MethodologyParameters'
import MethodologySources from '@/components/methodology/MethodologySources'

export default function MethodologyRoute() {
  return (
    <DocPageShell eyebrow="How this works" title="Methodology">
      <section className="flex flex-col gap-3">
        <h2 className="text-[1.125rem] font-semibold tracking-tight text-ink">Heat dose formula</h2>
        <MethodologyDoseFormula />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-[1.125rem] font-semibold tracking-tight text-ink">Parameters in use</h2>
        <MethodologyParameters />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-[1.125rem] font-semibold tracking-tight text-ink">What we measured</h2>
        <p className="text-ink-muted">
          Route-choice contrast in this AOI is small and reported as such, not rounded up — see{' '}
          <Link to="/limitations" className="underline underline-offset-3 hover:text-ink">
            Limitations
          </Link>{' '}
          point 10. The full numeric record — every hourly curve, every school&rsquo;s calibration table, every
          outcome computed per fase — lives in <code className="text-sm">docs/METHODOLOGY.md</code> in the
          project repository. This page summarizes the method; that file is the ledger.
        </p>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-[1.125rem] font-semibold tracking-tight text-ink">Data sources & citations</h2>
        <MethodologySources />
      </section>
    </DocPageShell>
  )
}
