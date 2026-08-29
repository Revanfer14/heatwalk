import LegendLineSwatch from '@/components/LegendLineSwatch'
import { LEGEND_AOI_LABEL } from '@/lib/legendContent'
import { cn } from '@/lib/utils'

interface ParentMapLegendContentProps {
  hideHeatData: boolean
}

export default function ParentMapLegendContent({ hideHeatData }: ParentMapLegendContentProps) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-subtle">Routes</h3>
        <ul className="flex flex-col gap-2">
          <li className="flex items-center gap-2 text-ink">
            <LegendLineSwatch
              dashed={hideHeatData}
              className={hideHeatData ? 'text-ink-subtle' : 'text-route-coolest'}
            />
            <span>Selected route</span>
          </li>
          <li className={cn('flex items-center gap-2 text-ink', hideHeatData && 'opacity-50')}>
            <LegendLineSwatch dashed={false} className="text-ink-subtle" />
            <span>Other route option</span>
          </li>
          <li className={cn('flex items-center gap-2 text-ink', hideHeatData && 'opacity-50')}>
            <LegendLineSwatch dashed={false} className="text-zone-bus" />
            <span>Coolest route still crosses the threshold</span>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-subtle">Radius circle</h3>
        <div className="flex items-center gap-2 text-ink">
          <LegendLineSwatch dashed className="text-ink-muted" />
          <span>Official walk zone</span>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-subtle">Map context</h3>
        <div className="flex items-center gap-2 text-ink">
          <LegendLineSwatch dashed className="text-ink-subtle" />
          <span>{LEGEND_AOI_LABEL}</span>
        </div>
      </section>
    </div>
  )
}
