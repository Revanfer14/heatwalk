import ClassificationBadge from '@/components/ClassificationBadge'
import LegendLineSwatch from '@/components/LegendLineSwatch'
import { BLOCK_CLASS_DEFINITION, LEGEND_AOI_LABEL, LEGEND_RADIUS_LINES, LEGEND_TEMP_LABEL_NOTE } from '@/lib/legendContent'
import { MISCLASSIFIED_HIGHLIGHT_LABELS } from '@/lib/misclassifiedHighlight'
import { formatDose, formatMiles, formatTemperaturePair } from '@/lib/units'
import { cn } from '@/lib/utils'
import type { MisclassifiedHighlight } from '@/lib/districtStateContext'
import type { BlockClass, SchoolSummary, TempsMeta } from '@/lib/types'

const BLOCK_CLASSES: BlockClass[] = ['green', 'yellow', 'red']

const RADIUS_MILES_BY_ID: Record<'officialZone' | 'doseRadius', (summary: SchoolSummary) => number> = {
  officialZone: (summary) => summary.radius_kebijakan_mi,
  doseRadius: (summary) => summary.radius_setara_dosis_mi,
}

function activeHighlightLabels(highlight: MisclassifiedHighlight): string[] {
  return (Object.keys(highlight) as (keyof MisclassifiedHighlight)[])
    .filter((category) => highlight[category])
    .map((category) => MISCLASSIFIED_HIGHLIGHT_LABELS[category])
}

interface MapLegendContentProps {
  hideHeatData: boolean
  schoolSummary: SchoolSummary | null
  meta: TempsMeta | null
  misclassifiedHighlight: MisclassifiedHighlight
}

export default function MapLegendContent({
  hideHeatData,
  schoolSummary,
  meta,
  misclassifiedHighlight,
}: MapLegendContentProps) {
  const highlightLabels = hideHeatData ? [] : activeHighlightLabels(misclassifiedHighlight)

  return (
    <div className="flex flex-col gap-4 text-sm">
      <section className={cn('flex flex-col gap-2', hideHeatData && 'opacity-50')}>
        <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-subtle">Zone classification</h3>
        <ul className="flex flex-col gap-2">
          {BLOCK_CLASSES.map((blockClass) => (
            <li key={blockClass} className="flex flex-col gap-0.5">
              <ClassificationBadge blockClass={blockClass} />
              <p className="pl-[18px] text-xs text-ink-muted">{BLOCK_CLASS_DEFINITION[blockClass]}</p>
            </li>
          ))}
        </ul>
      </section>

      {highlightLabels.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-subtle">Spotlighted blocks</h3>
          <ul className="flex flex-col gap-1 text-ink">
            {highlightLabels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
          <p className="text-xs text-ink-muted">Other blocks dim while this is on.</p>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-subtle">Radius circles</h3>
        <ul className="flex flex-col gap-2">
          {LEGEND_RADIUS_LINES.map((line) => {
            const isHeatDerived = line.id === 'doseRadius'
            const miles = schoolSummary !== null ? RADIUS_MILES_BY_ID[line.id](schoolSummary) : null
            return (
              <li
                key={line.id}
                className={cn(
                  'flex items-center gap-2 text-ink',
                  isHeatDerived && hideHeatData && 'opacity-50',
                )}
              >
                <LegendLineSwatch dashed={line.dashed} className="text-ink-muted" />
                <span>{line.label}</span>
                {miles !== null && <span className="ml-auto tabular-nums text-ink-muted">{formatMiles(miles)}</span>}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-subtle">Map context</h3>
        <div className="flex items-center gap-2 text-ink">
          <LegendLineSwatch dashed className="text-ink-subtle" />
          <span>{LEGEND_AOI_LABEL}</span>
        </div>
        <p className={cn('text-xs text-ink-muted', hideHeatData && 'opacity-50')}>{LEGEND_TEMP_LABEL_NOTE}</p>
      </section>

      <section className={cn('flex flex-col gap-1 border-t border-border pt-3', hideHeatData && 'opacity-50')}>
        <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-subtle">Reading the numbers</h3>
        {meta !== null ? (
          <p className="text-xs text-ink-muted">
            A block turns red when even its coolest route accumulates {formatDose(meta.threshold)} of heat dose above
            the {formatTemperaturePair(meta.baseline_c)} baseline.
          </p>
        ) : (
          <p className="text-xs text-ink-muted">
            A block turns red when even its coolest route accumulates more heat dose than the baseline threshold.
            Select a school to see its exact numbers.
          </p>
        )}
      </section>
    </div>
  )
}
