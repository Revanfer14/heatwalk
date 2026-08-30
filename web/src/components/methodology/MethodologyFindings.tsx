import { Link } from 'react-router-dom'

export default function MethodologyFindings() {
  return (
    <div className="flex flex-col gap-3 text-ink-muted">
      <p>
        <span className="font-medium text-ink">Time of day matters far more than route choice.</span> Length-
        weighted mean air temperature across the network rises 8.97°C (16.2°F) between 07:00 and 15:00. Spatial
        contrast within the AOI at any single hour is roughly 1.8°C. When a child walks home is a much larger
        lever than which street they take.
      </p>
      <p>
        <span className="font-medium text-ink">Route choice buys very little, and that is reported as measured.</span>{' '}
        Comparing the coolest route against the shortest at the canonical hour, the difference in mean route
        temperature ranges from 0.00°C down to −0.75°C. For most origin–school pairs the coolest route{' '}
        <em>is</em> the shortest route: there is no cooler alternative to find. Shade maps and surface-temperature
        maps imply a much larger benefit; measured 2m air temperature does not support it. This is why
        HeatWalk&rsquo;s recommendation is a change of mode — walk to bus — rather than a change of street.
      </p>
      <p>
        <span className="font-medium text-ink">The yellow category is thin by construction.</span> Yellow
        requires the shortest and coolest doses to fall on opposite sides of the threshold. When both routes are
        the same path, no threshold value can separate them. Yellow was empty in the initial six-school run and
        remains small at 42 schools. The threshold was never moved to fill it.
      </p>
      <p>
        <span className="font-medium text-ink">The defensible radius is far below the policy radius.</span> The
        district applies a uniform 2.0 mile walk radius across all grade levels. The dose-equivalent radius — the
        furthest distance whose coolest route is still under the threshold at the canonical hour — is well under
        half of that at every school analyzed. Per-school figures appear in the{' '}
        <Link to="/district" className="underline underline-offset-3 hover:text-ink">
          district panel
        </Link>
        , read from summary.json.
      </p>
      <p>
        <span className="font-medium text-ink">Exceedance days are a hybrid, not a measurement.</span> Days per
        school year above the threshold combine the hourly ASOS record at Orlando International (2019–2025,
        2,130 school-calendar days) with a per-block spatial offset derived from FortyGuard on the modeled day. It
        assumes that offset is stable from day to day, and that assumption is not tested. No additional FortyGuard
        calls were made for it.
      </p>
    </div>
  )
}
