interface SourceLink {
  label: string
  href: string
}

interface SourceGroup {
  title: string
  sources: SourceLink[]
}

const SOURCE_GROUPS: SourceGroup[] = [
  {
    title: 'Scientific',
    sources: [
      {
        label: 'Lanza et al., "Heat-Resilient Schoolyards: Access to Playgrounds and Shade" — J Phys Act Health 2023;20(2):134–141',
        href: 'https://journals.humankinetics.com/view/journals/jpah/20/2/article-p134.xml',
      },
      {
        label: 'Meng et al., "Investigation of heat stress on urban roadways for commuting children" — Urban Climate 2023;49:101564',
        href: 'https://doi.org/10.1016/j.uclim.2023.101564',
      },
      {
        label: 'Arizona Department of Health Services, Managing Extreme Heat Recommendations for Schools (2021)',
        href: 'https://www.azdhs.gov/documents/preparedness/epidemiology-disease-control/extreme-weather/heat/managing-extreme-heat-recommendations-for-schools.pdf',
      },
    ],
  },
  {
    title: 'Legal',
    sources: [
      {
        label: 'Florida Statute §1006.21 — Transportation of public school students',
        href: 'https://www.flsenate.gov/Laws/Statutes/2024/1006.21',
      },
      {
        label: 'Florida Statute §1006.23 — Hazardous walking conditions',
        href: 'https://www.flsenate.gov/Laws/Statutes/2024/1006.23',
      },
      {
        label: 'Orange County Public Schools Transportation FAQs — source of the 2.0 mile walk radius',
        href: 'https://www.ocps.net/transportation-faqs',
      },
    ],
  },
  {
    title: 'Data and APIs',
    sources: [
      { label: 'FortyGuard Temperature API — tcm heatmap, 60m, hourly', href: 'https://docs-api.fortyguard.com' },
      {
        label: 'Iowa Environmental Mesonet ASOS, Iowa State University — METAR ground truth and the Orlando MCO hourly record',
        href: 'https://mesonet.agron.iastate.edu',
      },
      {
        label: 'NCES EDGE — school locations, grade levels and enrollment',
        href: 'https://nces.ed.gov/opengis/rest/services',
      },
      {
        label: 'US Census Bureau — TIGERweb 2020 block geometry, 2020 DHC table P12, ACS 2022 5-year B19013 and B17001',
        href: 'https://www.census.gov/data/developers/data-sets.html',
      },
      { label: 'OpenStreetMap via OSMnx — pedestrian street network', href: 'https://www.openstreetmap.org' },
      { label: 'OpenFreeMap — basemap vector tiles, data from OpenStreetMap', href: 'https://openfreemap.org' },
    ],
  },
]

export default function MethodologySources() {
  return (
    <div className="flex flex-col gap-4">
      {SOURCE_GROUPS.map((group) => (
        <div key={group.title} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-ink">{group.title}</h3>
          <ul className="flex flex-col gap-2 text-sm">
            {group.sources.map((source) => (
              <li key={source.href}>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink-muted underline underline-offset-3 hover:text-ink"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
