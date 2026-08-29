export default function MethodologyParameterRationale() {
  return (
    <div className="flex flex-col gap-3 text-ink-muted">
      <p>
        <span className="font-medium text-ink">Baseline 33.0°C (91.4°F)</span> comes from Lanza et al. (2023),
        which identifies 33°C as the behavioural turning point for children in heat. It is a documented choice,
        not a natural constant.
      </p>
      <p>
        <span className="font-medium text-ink">The dose threshold of 110°C·min is a calibration, not an existing
        safety standard.</span> No published threshold exists in °C·minutes. 110 was selected as the value that
        produced a non-degenerate three-category distribution, and it has not been moved since. It was not lowered
        to fill the yellow category when yellow came back empty, and not raised when the red share shifted as
        coverage grew.
      </p>
      <p>
        <span className="font-medium text-ink">The canonical hour is derived from the data, not hardcoded.</span>{' '}
        The pipeline computes a median air temperature across the AOI for each pulled hour and takes the highest.
      </p>
      <p>
        <span className="font-medium text-ink">λ is calibrated per school</span>, as the smallest candidate from{' '}
        <code className="text-sm text-ink">[0, 0.005, 0.02, 0.05, 0.2, 1.0]</code> that keeps every route within
        1.4× the shortest distance at every hour, not only the canonical one. Testing only the canonical hour was
        an early bug: between 07:00 and 09:00 the entire AOI sits below baseline, every dose is zero, and Dijkstra
        over a uniformly zero weight returns an arbitrary path — one school measured a 2.888× detour at 07:00.
        Testing across all hours removes it. At the canonical hour the correction changed no classification.
      </p>
    </div>
  )
}
