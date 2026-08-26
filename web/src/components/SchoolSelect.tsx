import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { School } from '@/lib/types'

interface SchoolSelectProps {
  schools: School[]
  selectedSchoolId: string | null
  onSelect: (schoolId: string) => void
}

export default function SchoolSelect({ schools, selectedSchoolId, onSelect }: SchoolSelectProps) {
  return (
    <Select value={selectedSchoolId ?? undefined} onValueChange={onSelect}>
      <SelectTrigger className="w-full" aria-label="School">
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
  )
}
