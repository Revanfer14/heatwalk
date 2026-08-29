import Metric from '@/components/Metric'
import MisclassifiedHighlightToggle from '@/components/MisclassifiedHighlightToggle'
import { Separator } from '@/components/ui/separator'
import type { MisclassifiedHighlight } from '@/lib/districtStateContext'
import { MISCLASSIFIED_HIGHLIGHT_LABELS, misclassifiedCountsForHour } from '@/lib/misclassifiedHighlight'
import type { SchoolSummary } from '@/lib/types'

interface SchoolSummaryRowProps {
  summary: SchoolSummary
  hour: string | null
  misclassifiedHighlight: MisclassifiedHighlight
  onToggleMisclassifiedHighlight: (category: keyof MisclassifiedHighlight) => void
  hideHeatData: boolean
}

export default function SchoolSummaryRow({
  summary,
  hour,
  misclassifiedHighlight,
  onToggleMisclassifiedHighlight,
  hideHeatData,
}: SchoolSummaryRowProps) {
  const misclassified = misclassifiedCountsForHour(summary, hour)

  return (
    <div className="flex flex-col gap-3">
      <Metric label="Students in walk zone" value={summary.in_walk_zone} />
      <Separator />
      <div className="flex flex-col gap-3">
        <MisclassifiedHighlightToggle
          label={MISCLASSIFIED_HIGHLIGHT_LABELS.walkShouldBus}
          count={misclassified.walk_should_bus}
          checked={misclassifiedHighlight.walkShouldBus}
          onToggle={() => onToggleMisclassifiedHighlight('walkShouldBus')}
          hideHeatData={hideHeatData}
        />
        <MisclassifiedHighlightToggle
          label={MISCLASSIFIED_HIGHLIGHT_LABELS.busNotNeeded}
          count={misclassified.bus_not_needed}
          checked={misclassifiedHighlight.busNotNeeded}
          onToggle={() => onToggleMisclassifiedHighlight('busNotNeeded')}
          hideHeatData={hideHeatData}
        />
      </div>
    </div>
  )
}
