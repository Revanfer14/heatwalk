import { Button } from '@/components/ui/button'
import { buildReclassificationCsv, downloadCsv } from '@/lib/csvExport'
import type { BlockFeature } from '@/lib/types'

interface CsvExportButtonProps {
  schoolId: string
  blocks: BlockFeature[]
  daysExceedancePerYear: number | null
}

export default function CsvExportButton({ schoolId, blocks, daysExceedancePerYear }: CsvExportButtonProps) {
  const handleExport = (): void => {
    const csv = buildReclassificationCsv(blocks, daysExceedancePerYear)
    downloadCsv(`${schoolId}-reclassification.csv`, csv)
  }

  return (
    <Button type="button" variant="outline" onClick={handleExport}>
      Export reclassification list (CSV)
    </Button>
  )
}
