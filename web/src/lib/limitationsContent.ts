export interface LimitationEntry {
  id: string
  title: string
  body: string
}

export const PRD_LIMITATIONS: LimitationEntry[] = [
  {
    id: 'l1',
    title: '60m resolution cannot tell sidewalk sides apart',
    body: 'Raster granularity is 60m, and the median OSM road segment in this AOI is only 45.4m long — shorter than one raster cell. Scoring happens at corridor level, not sidewalk level. Two sidewalks facing each other on the same street get the same temperature in this model.',
  },
  {
    id: 'l2',
    title: 'Not WBGT — an air-temperature-based heat dose index',
    body: 'FortyGuard tcm is verified 2m ambient air temperature (within ±3°C of METAR), not surface temperature. There is no wind speed or globe temperature component, so this is not Wet Bulb Globe Temperature. We never call it WBGT in this product.',
  },
  {
    id: 'l3',
    title: 'Coverage is limited to tiles actually pulled',
    body: 'Only six schools are analyzed inside the current AOI. Schools outside coverage show as gray pins labeled "Not analyzed" — never with an interpolated or guessed number.',
  },
  {
    id: 'l4',
    title: 'Routes are modeled from OpenStreetMap, not real foot traffic',
    body: 'Routing uses the OSM pedestrian network. Real children may cut through informal paths, parking lots, or vacant lots that are not mapped — the model cannot route through paths it does not know about.',
  },
  {
    id: 'l5',
    title: 'Walking speed is assumed at 1.2 m/s for every child',
    body: 'One constant speed is used for every dose calculation, from kindergarten to 12th grade, regardless of mobility differences.',
  },
  {
    id: 'l6',
    title: 'Not every child in a walk zone attends the assigned school',
    body: 'Charter, private, and open-enrollment students are not captured by geographic nearest-school assignment. Estimated to miss roughly 10–20% of the real population per school.',
  },
  {
    id: 'l7',
    title: 'Census block data carries differential-privacy noise',
    body: '2020 Census DHC P12 data has noise injected at the block level to protect privacy. Smaller blocks carry proportionally more noise relative to their true count.',
  },
  {
    id: 'l8',
    title: 'Building footprint is not the same as unit count',
    body: 'The dasymetric method used to estimate children per block does not separately correct for housing density. Dense apartment blocks will under-estimate compared to single-family blocks of equal land area.',
  },
  {
    id: 'l9',
    title: 'Block-to-school assignment is nearest-neighbor, not an official boundary',
    body: 'OCPS attendance-boundary GIS layers could not be reached programmatically, and NCES does not publish School Attendance Boundary Survey data as a queryable service for this AOI. Every block is assigned to its nearest analyzed school by straight-line distance — a proxy for the real attendance zone, not the zone itself.',
  },
  {
    id: 'l10',
    title: 'The benefit of route choice is small',
    body: 'Measured 2m air temperature varies far less across a neighborhood than shade maps or surface-temperature maps suggest. Across 2,304 block–school pairs, the coolest-route temperature advantage ranges from 0.00°C to 0.75°C, averaging 0.055°C. Exposure is dominated by time of day, not which street you take.',
  },
  {
    id: 'l11',
    title: 'The yellow category is thinner than it looks like it should be',
    body: 'Yellow requires the shortest route to fail the threshold while the coolest route still passes it. Because 89.9% of block–school pairs have an identical shortest and coolest route, there is almost no room for one threshold to separate them. Result: 0 yellow blocks out of 2,304. The threshold was never lowered to force yellow blocks to appear.',
  },
  {
    id: 'l12',
    title: 'Classification uses one afternoon trip — these numbers under-count real exposure',
    body: 'Every classification is computed at the single hottest hour of the school day (15:00) for one direction of travel. Children walk twice a day, morning and afternoon. Because only the hotter, one-way trip is counted, every dose number in this product is an under-estimate of a child\'s real daily heat exposure, never an over-estimate.',
  },
  {
    id: 'l13',
    title: 'Hour coverage is not guaranteed uniform across future tiles',
    body: 'The current AOI has a full 10-hour sweep (07:00–16:00) shared by all six schools on one merged tile. If coverage expands to additional tiles later, a new tile could pull fewer hours depending on budget at that time — the hour slider only ever shows hours that were actually pulled, never an interpolated one.',
  },
  {
    id: 'l14',
    title: 'Exceedance days are a hybrid estimate, not a direct measurement',
    body: 'Days-per-year exceeding the dose threshold combine 2,130 days of historical airport station temperatures with a single FortyGuard sample used to derive a spatial offset per block. This assumes that offset stays stable day to day — an assumption we have not tested.',
  },
  {
    id: 'l15',
    title: 'Phoenix is a pipeline portability proof only',
    body: 'Phoenix was tested as an early candidate city, then dropped from the product because Arizona has no hazardous-walking statute. It is kept pipeline-only to prove the pipeline is portable across cities and is never rendered in this UI. Phoenix numbers are not a policy recommendation for Phoenix.',
  },
]

export const IMPLEMENTATION_LIMITATIONS: LimitationEntry[] = [
  {
    id: 'l16',
    title: 'Enrollment calibration: three of six schools remain outside the validated range',
    body: 'The correction factor used to scale census-based child estimates to real enrollment falls outside the 0.3–3.0 validated band for three schools even after restricting the calibration population to each school\'s walk radius: Maynard Evans High (3.163×, the only high school in the AOI, whose real catchment exceeds the 2-mile policy radius), UCP Pine Hills Charter (0.089×, a district-wide lottery school that does not follow geographic zoning), and Rosemont Elementary (0.232×, whose 2-mile radius contains real, closer elementary schools that are outside our six-school analyzed set, so their population is misattributed to Rosemont). All three factors are published as-is, not hidden behind a placeholder.',
  },
  {
    id: 'l17',
    title: 'Shade cooling is an unvalidated literature estimate',
    body: 'The estimated peak-temperature reduction under full canopy shade uses a uniform 1.5°C constant drawn from published literature, not a local measurement of actual tree cover in this AOI.',
  },
  {
    id: 'l18',
    title: 'Income and poverty are read from two different census geographies',
    body: 'Median income is available at block-group level, but poverty is suppressed at block-group level for this entire AOI and had to be read at the coarser tract level instead. A block can inherit a poverty rate from a tract that covers a wider, more varied area than its own block group.',
  },
  {
    id: 'l19',
    title: 'One routing verification check is still open',
    body: 'A manual re-run of the Fase 3 dose-curve check found 18 of 751 blocks at Maynard Evans High where the shortest-route dose spikes then drops sharply between 12:00 and 13:00, past the tool\'s wobble tolerance. The other five schools show zero violations. Not yet investigated further. It does not affect the canonical-hour classification (computed at 15:00, not 12:00) or the red/yellow/green counts.',
  },
]
