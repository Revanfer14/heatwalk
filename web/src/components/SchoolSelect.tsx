import FieldLabel from '@/components/FieldLabel'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { School } from '@/lib/types'

const SCHOOL_SELECT_ID = 'heatwalk-school-select'

interface SchoolSelectProps {
  schools: School[]
  selectedSchoolId: string | null
  onSelect: (schoolId: string) => void
}

export default function SchoolSelect({ schools, selectedSchoolId, onSelect }: SchoolSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={SCHOOL_SELECT_ID}>School</FieldLabel>
      <Select value={selectedSchoolId ?? undefined} onValueChange={onSelect}>
        <SelectTrigger id={SCHOOL_SELECT_ID} className="w-full">
          <SelectValue placeholder="Choose a school" />
        </SelectTrigger>
        <SelectContent>
          {schools.map((school) => (
            <SelectItem key={school.id} value={school.id}>
              {school.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
