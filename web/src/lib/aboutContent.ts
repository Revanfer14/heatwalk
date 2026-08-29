export interface AboutSection {
  id: string
  title: string
  paragraphs: string[]
}

export const ABOUT_SECTIONS: AboutSection[] = [
  {
    id: 'the-problem',
    title: 'The problem',
    paragraphs: [
      'School walk zones in the US are drawn with a fixed distance radius — Orange County Public Schools uses 2.0 miles, uniform K-12. Distance knows nothing about heat. A child walking 1.8 miles down a shadeless concrete corridor carries a far larger heat burden than a child walking 1.8 miles down a tree-lined street, but a distance-only policy treats both walks as identical.',
      'Children are named by the CDC as one of the groups most affected by extreme heat, alongside older adults and outdoor workers. Emergency department visits for pediatric heat-related illness rose 170% between 2012 and 2023 at children\'s hospitals across the southern US. A national study of extreme-heat days found the odds of a heat-illness ED visit rise 34% for kids aged 6–12 and 55% for teens 13–17, compared with typical warm-season days.',
      "Unlike a heat wave that adults can choose to avoid, a school commute isn't optional. A child walks the route a district drew, at the time a bell schedule sets — heat exposure is not a choice they get to make.",
    ],
  },
  {
    id: 'why-orlando',
    title: 'Why Orlando, for now',
    paragraphs: [
      "FortyGuard's Basic tier caps each API call at 10 mi², so covering more ground means mosaicking dozens of calls — each one asynchronous, each one polled to completion. That's a time cost, not a data-quality shortcut.",
      "The bigger reason is legal, not technical. HeatWalk's bus-eligibility recommendation only means something where a state has a hazardous walking conditions statute for a transportation director to act on. Florida does — Statute §1006.23 explicitly defines it, and funded roughly 19,700 extra bus riders in the 2019–2020 school year through this exact mechanism. Arizona doesn't; its policy (ARS §15-901) is purely distance-based. HeatWalk's pipeline is AOI-agnostic — a second AOI (Phoenix) is configured and runs through the same code path as proof it's portable to any US district, config file swapped, zero code changed — but that AOI is deliberately kept out of the map. A red block in a state with no hazardous-walking law is a recommendation with nowhere to go.",
    ],
  },
  {
    id: 'why-heat-dose',
    title: 'Why heat dose',
    paragraphs: [
      'HeatWalk replaces distance with cumulative heat dose — degrees above a safe baseline, accumulated minute by minute along the walk — as the impedance function for drawing walk zones. Dose captures both variables that distance ignores: how hot the route gets and how long a child is exposed to it. That also makes the route itself, not just the school location, something a family or a district can act on.',
    ],
  },
  {
    id: 'what-heatwalk-produces',
    title: 'What HeatWalk produces',
    paragraphs: [
      'For a district, HeatWalk outputs the list of census blocks that should be reclassified from "walks today" to bus-eligible, each backed by its shortest-route and coolest-route dose numbers — evidence a transportation director can bring to a school board meeting. For a family, it shows whether their specific route to their specific school crosses the threshold today, and whether choosing a different street is enough to bring it back under.',
    ],
  },
  {
    id: 'threshold-and-baseline',
    title: 'Threshold & baseline',
    paragraphs: [
      "Baseline: 33.0°C / 91.4°F. From Lanza et al. (2023) — 213 children aged 8–10, tracked with GPS and accelerometers during recess at three Austin, TX school parks. Outdoor physical activity dropped sharply once temperature crossed 33°C; that's the point HeatWalk uses as the floor above which heat dose starts accumulating.",
      'Threshold: 110.0 °C·min. This is a calibration choice, not an official safety standard — no such standard exists yet for children\'s heat dose while walking. It started at 220 °C·min (carried over from early Phoenix testing), was found unreachable anywhere in six years of Orlando airport temperature records, and was recalibrated to 110 so the real heat curve here produces a distribution instead of zero red blocks. Full derivation on the Methodology page.',
    ],
  },
]
