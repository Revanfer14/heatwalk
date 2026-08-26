interface SourceLink {
  label: string
  href: string
}

const SOURCES: SourceLink[] = [
  {
    label: 'Lanza et al., "Heat-Resilient Schoolyards" — J Phys Act Health 2023;20(2):134–141',
    href: 'https://journals.humankinetics.com/view/journals/jpah/20/2/article-p134.xml',
  },
  {
    label: 'Meng et al., "Investigation of heat stress on urban roadways for commuting children" — Urban Climate 2023;49:101564',
    href: 'https://doi.org/10.1016/j.uclim.2023.101564',
  },
  {
    label: 'Arizona DHS, Managing Extreme Heat Recommendations for Schools (2021)',
    href: 'https://www.azdhs.gov/documents/preparedness/epidemiology-disease-control/extreme-weather/heat/managing-extreme-heat-recommendations-for-schools.pdf',
  },
  {
    label: 'Florida Statute §1006.21 — Transportation of public school students',
    href: 'https://www.flsenate.gov/Laws/Statutes/2024/1006.21',
  },
  {
    label: 'Florida Statute §1006.23 — Hazardous walking conditions',
    href: 'https://www.flsenate.gov/Laws/Statutes/2024/1006.23',
  },
  { label: 'OCPS Transportation FAQs', href: 'https://www.ocps.net/transportation-faqs' },
  { label: 'FortyGuard API documentation', href: 'https://docs-api.fortyguard.com' },
  { label: 'Iowa Environmental Mesonet ASOS (Iowa State University)', href: 'https://mesonet.agron.iastate.edu' },
  { label: 'NCES EDGE school locations and enrollment', href: 'https://nces.ed.gov/opengis/rest/services' },
  {
    label: 'US Census Bureau — TIGERweb, 2020 DHC P12, ACS B19013/B17001',
    href: 'https://www.census.gov/data/developers/data-sets.html',
  },
]

export default function MethodologySources() {
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {SOURCES.map((source) => (
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
  )
}
