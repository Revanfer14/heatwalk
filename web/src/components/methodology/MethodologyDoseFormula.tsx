export default function MethodologyDoseFormula() {
  return (
    <div className="flex flex-col gap-3 text-ink-muted">
      <p>
        <span className="font-medium text-ink">tcm</span> is FortyGuard&rsquo;s thermal comfort metric — verified
        2m ambient air temperature, not surface temperature. Verified within ±3°C of a reference METAR reading at
        Phoenix Sky Harbor during Fase 0 (docs/METHODOLOGY.md, [Fase 0] Definisi tcm).
      </p>
      <p>
        Heat dose for one edge of the walking network is:
        <br />
        <code className="text-sm text-ink">
          dose = max(temp_c − baseline_c, 0) × (length_m / walk_speed_mps) / 60
        </code>
      </p>
      <p>
        The clamp at zero matters: Dijkstra cannot route on negative weights, and a cool edge must never earn a
        &ldquo;credit&rdquo; that makes a longer route win. Walk speed is a pipeline constant, 1.2 m/s, applied
        uniformly — see Limitations for what that simplifies away.
      </p>
      <p>
        Routing weighs every edge twice: by raw distance (the shortest route) and by{' '}
        <code className="text-sm text-ink">dose + lambda × length_m</code> (the coolest route, with a
        detour penalty so it never wanders more than 1.4× the shortest distance). One lambda value per school,
        held constant across all hours, so the route shown does not jump for reasons unrelated to heat as the
        hour slider moves.
      </p>
    </div>
  )
}
