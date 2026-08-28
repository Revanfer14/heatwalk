import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import RouteComparisonPanel from '@/components/RouteComparisonPanel'
import PetitionButton from '@/components/PetitionButton'
import type { BlockProperties, School, SolvedRoutes } from '@/lib/types'

interface RouteDetailsDisclosureProps {
  routes: SolvedRoutes
  hour: string
  address: string
  school: School
  block: BlockProperties | null
  hideHeatData: boolean
  isLive?: boolean
}

export default function RouteDetailsDisclosure({
  routes,
  hour,
  address,
  school,
  block,
  hideHeatData,
  isLive = false,
}: RouteDetailsDisclosureProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between text-sm font-medium text-ink"
      >
        Details
        {isOpen ? <ChevronUp strokeWidth={1.5} size={16} /> : <ChevronDown strokeWidth={1.5} size={16} />}
      </button>
      {isOpen && (
        <div className="mt-3 flex flex-col gap-4">
          <RouteComparisonPanel routes={routes} hour={hour} isLive={isLive} />
          {block !== null && (
            <PetitionButton address={address} school={school} block={block} hideHeatData={hideHeatData} />
          )}
        </div>
      )}
    </div>
  )
}
