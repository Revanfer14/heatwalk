export interface AboutSection {
  id: string
  title: string
  body: string
}

export const ABOUT_SECTIONS: AboutSection[] = [
  {
    id: 'the-problem',
    title: 'The problem',
    body: 'School walk zones in the US are drawn with a fixed distance radius — Orange County Public Schools uses 2.0 miles, uniform K-12. Distance knows nothing about heat. A child walking 1.8 miles down a shadeless concrete corridor carries a far larger heat burden than a child walking 1.8 miles down a tree-lined street, but a distance-only policy treats both walks as identical.',
  },
  {
    id: 'why-heat-dose',
    title: 'Why heat dose',
    body: 'HeatWalk replaces distance with cumulative heat dose — degrees above a safe baseline, accumulated minute by minute along the walk — as the impedance function for drawing walk zones. Dose captures both variables that distance ignores: how hot the route gets and how long a child is exposed to it. That also makes the route itself, not just the school location, something a family or a district can act on.',
  },
  {
    id: 'what-heatwalk-produces',
    title: 'What HeatWalk produces',
    body: 'For a district, HeatWalk outputs the list of census blocks that should be reclassified from "walks today" to bus-eligible, each backed by its shortest-route and coolest-route dose numbers — evidence a transportation director can bring to a school board meeting. For a family, it shows whether their specific route to their specific school crosses the threshold today, and whether choosing a different street is enough to bring it back under.',
  },
]
