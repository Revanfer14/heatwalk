import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { useAppState } from '@/hooks/useAppState'
import { useSchoolMeta } from '@/hooks/useSchoolMeta'
import { formatCelsius, formatDose } from '@/lib/units'

export default function MethodologyParameters() {
  const { schools } = useAppState()
  const firstSchoolId = schools[0]?.id ?? null
  const { meta, loading, error } = useSchoolMeta(firstSchoolId)

  if (loading) return <Skeleton className="h-48 w-full rounded-lg" />
  if (error !== null || meta === null) {
    return <p className="text-sm text-ink-muted">Could not load pipeline parameters from data/out/.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="text-ink-muted">Baseline temperature</TableCell>
            <TableCell className="tabular-nums">{formatCelsius(meta.baseline_c)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-ink-muted">Dose threshold</TableCell>
            <TableCell className="tabular-nums">{formatDose(meta.threshold)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-ink-muted">Canonical hour</TableCell>
            <TableCell className="tabular-nums">{meta.canonical_hour}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-ink-muted">Hours pulled</TableCell>
            <TableCell className="tabular-nums">{meta.hours.join(', ')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-ink-muted">Data fetched</TableCell>
            <TableCell className="tabular-nums">{meta.fetched_at}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-ink-muted">
              Route-detour penalty (lambda), {schools[0]?.name ?? 'this school'}
            </TableCell>
            <TableCell className="tabular-nums">{meta.lambda_detour}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p className="text-xs text-ink-subtle">
        Read live from {schools[0]?.name ?? 'the first analyzed school'}&rsquo;s temps.json. Lambda is calibrated
        separately per school — see docs/METHODOLOGY.md for the full six-school table.
      </p>
    </div>
  )
}
