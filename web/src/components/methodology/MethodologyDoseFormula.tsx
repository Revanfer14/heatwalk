import { Link } from 'react-router-dom'

export default function MethodologyDoseFormula() {
  return (
    <div className="flex flex-col gap-3 text-ink-muted">
      <p>For each edge of the walking network:</p>
      <p>
        <code className="text-sm text-ink">
          dose = max(temp_c − baseline_c, 0) × (length_m / walk_speed_mps) / 60
        </code>
      </p>
      <p>
        The result is in °C·minutes: how long a child spends above the baseline temperature, weighted by how far
        above it they are.
      </p>
      <p>Two properties matter.</p>
      <p>
        <span className="font-medium text-ink">The clamp at zero.</span> Dijkstra cannot route on negative weights,
        and a cool segment must never earn a credit that lets a longer route win.
      </p>
      <p>
        <span className="font-medium text-ink">Walking speed is one constant for every child</span>, 1.2 m/s. See{' '}
        <Link to="/limitations" className="underline underline-offset-3 hover:text-ink">
          Limitations
        </Link>{' '}
        for what that flattens.
      </p>
      <p>
        Routing runs twice over the same graph: once weighted by raw distance, once by{' '}
        <code className="text-sm text-ink">dose + λ × length_m</code>. λ is a detour penalty — without it the
        &ldquo;coolest&rdquo; route wanders. One λ per school, held constant across all hours, so the drawn route
        never changes for reasons unrelated to heat.
      </p>
    </div>
  )
}
