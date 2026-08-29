interface ApiBehavior {
  id: string
  lead: string
  body: string
}

const API_BEHAVIORS: ApiBehavior[] = [
  {
    id: 'null',
    lead: '-999 is a legacy null.',
    body: 'It is masked to NaN before any statistic is computed. Left in, it would corrupt every mean silently.',
  },
  {
    id: 'empty-success',
    lead: 'A start_time with a non-:00 minute returns Completed with zero cells.',
    body: 'An empty success, not an error. Every slice is on the hour, and the client raises rather than accepting an empty response as data.',
  },
  {
    id: 'flat-credits',
    lead: 'A heatmap call costs a flat 4,220 credits',
    body: 'regardless of area or granularity — verified across requests whose cell counts differed by 48×. So every call requests the full permitted box at the finest granularity; asking for less costs the same.',
  },
  {
    id: 'same-cell-values',
    lead: 'At 60m, each cell reports minimum, average and maximum as the same number.',
    body: 'Peak temperature therefore cannot come from the API. It is computed as the maximum across the cells an edge crosses.',
  },
]

export default function MethodologyTemperatureSource() {
  return (
    <div className="flex flex-col gap-3 text-ink-muted">
      <p>
        FortyGuard <code className="text-sm text-ink">POST /v1/heatmap</code>,{' '}
        <code className="text-sm text-ink">analytic_type=tcm</code>, 60m granularity, one call per hour per tile.
      </p>
      <p>
        <span className="font-medium text-ink">tcm is 2m ambient air temperature, not surface temperature.</span>{' '}
        Verified against a METAR reading at Phoenix Sky Harbor at the same local hour: tcm 41.83°C against 43.89°C
        observed, a difference of −2.06°C — inside the ±3°C air-temperature criterion, and nowhere near the ≥+8°C
        offset a surface product would show. The check was run in Phoenix during site selection, before the demo
        city moved to Florida. What it establishes is what the metric measures, which is not location-specific.
      </p>
      <p>Four API behaviours found by testing and applied throughout the pipeline:</p>
      <ul className="flex flex-col gap-2 text-sm">
        {API_BEHAVIORS.map((behavior) => (
          <li key={behavior.id}>
            <span className="font-medium text-ink">{behavior.lead}</span> {behavior.body}
          </li>
        ))}
      </ul>
      <p>
        Edge temperatures are sampled roughly every 20m along the original street geometry, before simplification.
        The median street segment here is 45.4m — shorter than one 60m cell — so an edge&rsquo;s peak often equals
        its mean. That is correct at this resolution, not a sampling failure.
      </p>
    </div>
  )
}
