import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface ClassificationRule {
  category: string
  rule: string
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  { category: 'Safe to walk', rule: 'The shortest route is already under the threshold' },
  {
    category: 'Route choice is enough',
    rule: 'The shortest route exceeds it, but a cooler route does not',
  },
  { category: 'Bus recommended', rule: 'Even the coolest available route exceeds it' },
]

export default function MethodologyClassification() {
  return (
    <div className="flex flex-col gap-3 text-ink-muted">
      <p>At the canonical hour, for each populated census block:</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Rule</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {CLASSIFICATION_RULES.map((entry) => (
            <TableRow key={entry.category}>
              <TableCell className="font-medium text-ink">{entry.category}</TableCell>
              <TableCell className="text-ink-muted">{entry.rule}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p>
        The third category is the product&rsquo;s actual claim: not that a better street exists, but that none
        does. Each block also stores the last hour before its coolest route crosses the threshold, which is what
        produces the &ldquo;safe if they leave before ...&rdquo; line.
      </p>
      <p>
        Blocks are assigned to the nearest analyzed school. Real attendance boundaries were not usable — the
        district&rsquo;s ArcGIS portal blocks automated access, and NCES no longer publishes school attendance
        boundaries as a service — so nearest-school is a documented fallback and the largest single source of
        error on this page. Coverage of 42 analyzed schools brings 98.9% of blocks inside the policy radius of the
        school they are assigned to; at six schools it was 27.2%, which inflated distances and therefore doses.
        That change came from adding schools, not from touching any parameter.
      </p>
    </div>
  )
}
