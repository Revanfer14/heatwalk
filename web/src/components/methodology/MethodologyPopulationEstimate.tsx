export default function MethodologyPopulationEstimate() {
  return (
    <div className="flex flex-col gap-3 text-ink-muted">
      <p>
        Student addresses are protected under FERPA and will never be available to anyone building a tool like
        this. Everything below is public data, pulled directly from the agencies that publish it. None of it is
        synthetic, sampled, or carried over from a fixture.
      </p>
      <p>
        <span className="font-medium text-ink">Block geometry and population.</span> Census block boundaries and
        their 2020 populations come from the Census Bureau&rsquo;s TIGERweb service, queried against the study
        area — 3,198 blocks spanning 20 tracts. These are real 2020 Census blocks with their real GEOIDs, the same
        identifiers that appear in the exported reclassification list.
      </p>
      <p>
        <span className="font-medium text-ink">Children per block.</span> Pulled live from the Census Bureau API:
        2020 Decennial DHC table P12, six variables covering ages 5–9, 10–14 and 15–17 for both sexes, one request
        per tract, cached to disk. Income and poverty context come from ACS 2022 5-year B19013 at block-group
        level and B17001 at tract level. Poverty is suppressed by the Census Bureau at block-group level across
        this whole area, so it is read at the coarser tract level — a granularity limit, not a gap that was filled
        with a guess.
      </p>
      <p>
        <span className="font-medium text-ink">Grade-range reallocation.</span> A block does not send every child
        aged 5–17 to the same school. The census five-year brackets are reallocated into real grade ranges before
        assignment — elementary takes all of 5–9 plus a fifth of 10–14, middle takes three-fifths of 10–14, high
        takes a fifth of 10–14 plus all of 15–17, assuming a uniform distribution within each bracket. An earlier
        version skipped this and pushed all 5–17 to the nearest school, which inflated elementary denominators
        with teenagers who would never attend there.
      </p>
      <p>
        <span className="font-medium text-ink">Calibration to official enrollment.</span> The dasymetric estimate
        is scaled to the enrollment each school actually reports to NCES:
      </p>
      <p>
        <code className="text-sm text-ink">correction_factor = NCES enrollment / dasymetric estimate</code>
      </p>
      <p>with the denominator restricted to blocks inside that school&rsquo;s own policy radius.</p>
      <p>
        <span className="font-medium text-ink">What &ldquo;students in walk zone&rdquo; means.</span> It is the
        calibrated child count of every block whose distance to the assigned school is within the policy radius.
        It is purely geometric — distance against a published radius — so it does not move when the hour slider
        moves, and it does not depend on temperature at all. The heat-dependent figures are the two
        misclassification rows beneath it, and those do change by hour.
      </p>
      <p>
        12 of 42 schools land outside the 0.3–3.0 sanity band, and the pattern is not random: every high school
        and most middle schools in the area come out too high, while charter and alternative programs come out
        too low. Secondary catchments are geographically much larger than elementary ones, so a nearest-school
        estimate systematically undercounts their denominators; lottery-enrolled schools have no geographic
        catchment at all. Factors are published as computed rather than clipped into the band.
      </p>
    </div>
  )
}
