import { useEffect, useMemo, useState } from 'react'
import FieldLabel from '@/components/FieldLabel'
import type { School } from '@/lib/types'

const DESTINATION_INPUT_ID = 'heatwalk-destination-input'
const SUGGESTION_CLOSE_DELAY_MS = 150

interface DestinationFieldProps {
  schools: School[]
  selectedSchoolId: string | null
  onSelect: (schoolId: string) => void
}

export default function DestinationField({ schools, selectedSchoolId, onSelect }: DestinationFieldProps) {
  const selectedSchool = schools.find((school) => school.id === selectedSchoolId) ?? null
  const [queryText, setQueryText] = useState(selectedSchool?.name ?? '')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) setQueryText(selectedSchool?.name ?? '')
  }, [selectedSchool, isOpen])

  const matches = useMemo(() => {
    const normalizedQuery = queryText.trim().toLowerCase()
    return normalizedQuery.length === 0
      ? schools
      : schools.filter((school) => school.name.toLowerCase().includes(normalizedQuery))
  }, [schools, queryText])

  const selectSchool = (school: School): void => {
    onSelect(school.id)
    setQueryText(school.name)
    setIsOpen(false)
  }

  const handleBlur = (): void => {
    window.setTimeout(() => {
      setIsOpen(false)
      setQueryText(selectedSchool?.name ?? '')
    }, SUGGESTION_CLOSE_DELAY_MS)
  }

  return (
    <div className="relative flex flex-col gap-1.5">
      <FieldLabel htmlFor={DESTINATION_INPUT_ID}>Destination</FieldLabel>
      <input
        id={DESTINATION_INPUT_ID}
        value={queryText}
        onChange={(event) => {
          setQueryText(event.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        placeholder="Search for a school"
        autoComplete="off"
        className="w-full rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus-visible:border-ink"
      />
      {isOpen && (
        <ul className="absolute top-full z-controls mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border-strong bg-surface-raised py-1 shadow-lg">
          {matches.length > 0 ? (
            matches.map((school) => (
              <li key={school.id}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSchool(school)}
                  className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-surface"
                >
                  {school.name}
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-ink-subtle">No matching school</li>
          )}
        </ul>
      )}
    </div>
  )
}
