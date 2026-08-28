import RouteOptionList, { type SelectedRouteId } from '@/components/RouteOptionList'
import SafeUntilLine from '@/components/SafeUntilLine'
import RouteDetailsDisclosure from '@/components/RouteDetailsDisclosure'
import type { BlockFeature, School, SolvedRoutes } from '@/lib/types'

interface ParentRouteResultsProps {
  isReady: boolean
  school: School
  solvedRoutes: SolvedRoutes | null
  hour: string
  matchedBlock: BlockFeature | null
  addressText: string
  hideHeatData: boolean
  isLive: boolean
  modeledDate: string
  selectedRouteId: SelectedRouteId
  onSelectRoute: (routeId: SelectedRouteId) => void
}

export default function ParentRouteResults({
  isReady,
  school,
  solvedRoutes,
  hour,
  matchedBlock,
  addressText,
  hideHeatData,
  isLive,
  modeledDate,
  selectedRouteId,
  onSelectRoute,
}: ParentRouteResultsProps) {
  if (!isReady || solvedRoutes === null) return null

  return (
    <div className="flex flex-col gap-3">
      <RouteOptionList
        routes={solvedRoutes}
        isLive={isLive}
        selectedRouteId={selectedRouteId}
        onSelectRoute={onSelectRoute}
      />
      <SafeUntilLine safeUntilHour={matchedBlock?.properties.safe_until_hour ?? null} />
      {isLive && (
        <p className="text-xs text-ink-subtle">
          Classification and safe-until time are from the modeled day ({modeledDate}), not today.
        </p>
      )}
      <RouteDetailsDisclosure
        routes={solvedRoutes}
        hour={hour}
        address={addressText}
        school={school}
        block={matchedBlock?.properties ?? null}
        hideHeatData={hideHeatData}
        isLive={isLive}
      />
    </div>
  )
}
