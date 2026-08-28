import RouteOptionCard from '@/components/RouteOptionCard'
import type { SelectedRouteId } from '@/lib/selectedRouteId'
import type { SolvedRoutes } from '@/lib/types'

export type { SelectedRouteId }

interface RouteOptionListProps {
  routes: SolvedRoutes
  isLive?: boolean
  selectedRouteId: SelectedRouteId
  onSelectRoute: (routeId: SelectedRouteId) => void
}

export default function RouteOptionList({ routes, isLive = false, selectedRouteId, onSelectRoute }: RouteOptionListProps) {
  return (
    <div className="flex flex-col gap-2">
      <RouteOptionCard
        label="Coolest route"
        route={routes.coolest}
        emphasize
        isLive={isLive}
        selected={selectedRouteId === 'coolest'}
        onSelect={() => onSelectRoute('coolest')}
      />
      {routes.alternates.map((alternate, index) => {
        const routeId: SelectedRouteId = `alternate-${index}`
        return (
          <RouteOptionCard
            key={routeId}
            label={`Alternate route ${index + 1}`}
            route={alternate}
            isLive={isLive}
            selected={selectedRouteId === routeId}
            onSelect={() => onSelectRoute(routeId)}
          />
        )
      })}
    </div>
  )
}
