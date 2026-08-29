import DocPageShell from '@/components/DocPageShell'
import MethodologyCanonicalHourTable from '@/components/methodology/MethodologyCanonicalHourTable'
import MethodologyClassification from '@/components/methodology/MethodologyClassification'
import MethodologyDoseFormula from '@/components/methodology/MethodologyDoseFormula'
import MethodologyFindings from '@/components/methodology/MethodologyFindings'
import MethodologyLiveConditions from '@/components/methodology/MethodologyLiveConditions'
import MethodologyParameterRationale from '@/components/methodology/MethodologyParameterRationale'
import MethodologyParameters from '@/components/methodology/MethodologyParameters'
import MethodologyPopulationEstimate from '@/components/methodology/MethodologyPopulationEstimate'
import MethodologySources from '@/components/methodology/MethodologySources'
import MethodologyTemperatureSource from '@/components/methodology/MethodologyTemperatureSource'

export default function MethodologyRoute() {
  return (
    <DocPageShell eyebrow="How this works" title="Methodology">
      <p className="text-ink-muted">
        How HeatWalk turns temperature into a bus-eligibility decision. Every number on this site is read from a
        file in <code className="text-sm">data/out/</code>. Nothing on screen is recomputed or estimated in the
        browser.
      </p>
      <section className="flex flex-col gap-3">
        <h2 className="text-[1.125rem] font-semibold tracking-tight text-ink">1. The heat dose formula</h2>
        <MethodologyDoseFormula />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-[1.125rem] font-semibold tracking-tight text-ink">2. Parameters in use</h2>
        <MethodologyParameters />
        <h3 className="text-sm font-medium text-ink">Why these values</h3>
        <MethodologyParameterRationale />
        <MethodologyCanonicalHourTable />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-[1.125rem] font-semibold tracking-tight text-ink">
          3. Where the temperature comes from
        </h2>
        <MethodologyTemperatureSource />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-[1.125rem] font-semibold tracking-tight text-ink">4. Classification</h2>
        <MethodologyClassification />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-[1.125rem] font-semibold tracking-tight text-ink">5. What we measured</h2>
        <MethodologyFindings />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-[1.125rem] font-semibold tracking-tight text-ink">6. Estimating how many children</h2>
        <MethodologyPopulationEstimate />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-[1.125rem] font-semibold tracking-tight text-ink">7. Today&rsquo;s conditions</h2>
        <MethodologyLiveConditions />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-[1.125rem] font-semibold tracking-tight text-ink">
          8. What this page does not contain
        </h2>
        <p className="text-ink-muted">
          This is the summary. The full record — every hourly curve, every school&rsquo;s calibration table, every
          gate outcome, every bug found and what it changed — lives in{' '}
          <code className="text-sm">docs/METHODOLOGY.md</code> in the repository, written as the work happened
          rather than after it. Known weaknesses are listed separately under Limitations, including the ones that
          make the numbers here smaller or messier than they could have been made to look.
        </p>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-[1.125rem] font-semibold tracking-tight text-ink">Sources and citations</h2>
        <MethodologySources />
      </section>
    </DocPageShell>
  )
}
