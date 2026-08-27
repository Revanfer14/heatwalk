import { useMemo } from 'react'
import FieldLabel from '@/components/FieldLabel'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { School } from '@/lib/types'
import type { SchoolNational } from '@/lib/districtTypes'

const UNANALYZED_RESULT_CAP = 50
const SCHOOL_SEARCH_INPUT_ID = 'heatwalk-school-search'

interface SchoolListProps {
  analyzedSchools: School[]
  nationalSchools: SchoolNational[] | null
  selectedSchoolId: string | null
  onSelectAnalyzed: (schoolId: string) => void
  onSelectUnanalyzed: (school: SchoolNational) => void
  searchText: string
  onSearchTextChange: (text: string) => void
  includeUnanalyzed: boolean
  onIncludeUnanalyzedChange: (value: boolean) => void
}

export default function SchoolList({
  analyzedSchools,
  nationalSchools,
  selectedSchoolId,
  onSelectAnalyzed,
  onSelectUnanalyzed,
  searchText,
  onSearchTextChange,
  includeUnanalyzed,
  onIncludeUnanalyzedChange,
}: SchoolListProps) {
  const query = searchText.trim().toLowerCase()

  const visibleAnalyzed = useMemo(
    () =>
      query === ''
        ? analyzedSchools
        : analyzedSchools.filter((school) => school.name.toLowerCase().includes(query)),
    [analyzedSchools, query],
  )

  const visibleUnanalyzed = useMemo(() => {
    if (!includeUnanalyzed || query === '' || nationalSchools === null) return []
    return nationalSchools
      .filter((school) => !school.analyzed && school.name.toLowerCase().includes(query))
      .slice(0, UNANALYZED_RESULT_CAP)
  }, [includeUnanalyzed, query, nationalSchools])

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={SCHOOL_SEARCH_INPUT_ID}>Search schools</FieldLabel>
        <input
          id={SCHOOL_SEARCH_INPUT_ID}
          value={searchText}
          onChange={(event) => onSearchTextChange(event.target.value)}
          placeholder="Search schools"
          className="w-full rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus-visible:border-ink"
        />
      </div>
      <label className="flex items-center gap-2 text-xs text-ink-muted">
        <Switch
          checked={includeUnanalyzed}
          onCheckedChange={onIncludeUnanalyzedChange}
          aria-label="Include schools not yet analyzed"
        />
        Include schools not yet analyzed
      </label>
      <nav aria-label="School list" className="flex-1 overflow-y-auto">
        <ul className="flex flex-col gap-0.5">
          {visibleAnalyzed.map((school) => (
            <li key={school.id}>
              <button
                type="button"
                onClick={() => onSelectAnalyzed(school.id)}
                aria-current={school.id === selectedSchoolId ? 'true' : undefined}
                className={cn(
                  'w-full rounded-md px-2 py-1.5 text-left text-sm',
                  school.id === selectedSchoolId ? 'bg-ink text-bg' : 'text-ink hover:bg-border',
                )}
              >
                {school.name}
              </button>
            </li>
          ))}
          {visibleUnanalyzed.map((school) => (
            <li key={school.id}>
              <button
                type="button"
                onClick={() => onSelectUnanalyzed(school)}
                className="w-full rounded-md px-2 py-1.5 text-left text-sm text-ink-subtle hover:bg-border"
              >
                {school.name}
              </button>
            </li>
          ))}
        </ul>
        {query !== '' && visibleAnalyzed.length === 0 && visibleUnanalyzed.length === 0 && (
          <p className="px-2 py-1.5 text-sm text-ink-subtle">No schools match &quot;{searchText}&quot;.</p>
        )}
      </nav>
    </div>
  )
}
