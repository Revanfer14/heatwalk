import type { SchoolNational } from '@/lib/districtTypes'

interface UnanalyzedSchoolNoticeProps {
  school: SchoolNational
}

export default function UnanalyzedSchoolNotice({ school }: UnanalyzedSchoolNoticeProps) {
  return (
    <div className="flex flex-col gap-2 p-4">
      <span className="text-sm font-semibold text-ink">{school.name}</span>
      <p className="text-sm text-ink-muted">Not yet analyzed — this tile hasn&apos;t been fetched.</p>
    </div>
  )
}
