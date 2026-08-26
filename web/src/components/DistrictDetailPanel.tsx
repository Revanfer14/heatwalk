import BlockDetailPanel from '@/components/BlockDetailPanel'
import CsvExportButton from '@/components/CsvExportButton'
import SegmentPriorityTable from '@/components/SegmentPriorityTable'
import UnanalyzedSchoolNotice from '@/components/UnanalyzedSchoolNotice'
import type { BlockFeature, SchoolSummary } from '@/lib/types'
import type { SchoolNational, SegmentPriorityRow } from '@/lib/districtTypes'

interface DistrictDetailPanelProps {
  unanalyzedNotice: SchoolNational | null
  selectedBlock: BlockFeature | null
  allBlocks: BlockFeature[]
  schoolId: string
  schoolName: string
  schoolSummary: SchoolSummary | null
  segments: SegmentPriorityRow[] | null
}

export default function DistrictDetailPanel({
  unanalyzedNotice,
  selectedBlock,
  allBlocks,
  schoolId,
  schoolName,
  schoolSummary,
  segments,
}: DistrictDetailPanelProps) {
  if (unanalyzedNotice !== null) return <UnanalyzedSchoolNotice school={unanalyzedNotice} />

  if (selectedBlock !== null) {
    return (
      <BlockDetailPanel
        block={selectedBlock}
        allBlocks={allBlocks}
        schoolName={schoolName}
        schoolSummary={schoolSummary}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <p className="text-sm text-ink-muted">Select a block on the map to see details.</p>
      {allBlocks.length > 0 && (
        <CsvExportButton
          schoolId={schoolId}
          blocks={allBlocks}
          daysExceedancePerYear={schoolSummary?.days_exceedance_per_year ?? null}
        />
      )}
      {segments !== null && <SegmentPriorityTable segments={segments} />}
    </div>
  )
}
