export default function MethodologyLiveConditions() {
  return (
    <div className="flex flex-col gap-3 text-ink-muted">
      <p>
        The routes a parent sees are re-weighted against current temperature. One heatmap call covers a 5km × 5km
        tile centred on the selected school at the current local hour, and the returned grid is sampled cell by
        cell along each street segment in the browser, using the same 20m spacing as the offline pipeline. The API
        key stays server-side; the browser only ever talks to a read-only function. Responses are cached for an
        hour, so repeat visitors in the same hour cost nothing. Streets outside that tile fall back to the modeled
        day.
      </p>
      <p>
        Classification, the &ldquo;safe until&rdquo; hour, and every district-level number stay on the modeled
        day, 2023-08-08, and are labelled as such. Those numbers have to stay reproducible; they cannot shift
        because today happens to be mild.
      </p>
    </div>
  )
}
