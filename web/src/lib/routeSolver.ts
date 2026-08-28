import type { SchoolGraph, SchoolTemps, SolvedRouteLeg, SolvedRoutes } from '@/lib/types'
import { buildRoutingGraph } from '@/lib/routeGraph'
import { dijkstra, reconstructPath, type RoutingAdjacency } from '@/lib/dijkstra'
import { summarizeRoute } from '@/lib/routeStats'
import { buildRouteSegments, flattenRouteGeometry } from '@/lib/routeGeometry'
import { nearestNode } from '@/lib/nearestNode'
import { findAlternateRoutes } from '@/lib/routeAlternatives'
import type { LiveEdgeTemperatures } from '@/lib/edgeLiveTemperatures'
import type { LonLat } from '@/lib/geoDistance'

function buildLeg(graph: SchoolGraph, adjacency: RoutingAdjacency, schoolToOriginPath: string[]): SolvedRouteLeg {
  const originToSchoolPath = [...schoolToOriginPath].reverse()
  const stats = summarizeRoute(adjacency, originToSchoolPath)
  const segments = buildRouteSegments(graph.nodes, graph.edges, adjacency, originToSchoolPath)
  const geometry = flattenRouteGeometry(segments)
  return { ...stats, geometry, segments }
}

export function solveRoutes(
  graph: SchoolGraph,
  temps: SchoolTemps,
  schoolPoint: LonLat,
  originPoint: LonLat,
  hour: string,
  temperatureOffsetC: number = 0,
  liveEdgeTemps?: LiveEdgeTemperatures,
): SolvedRoutes | null {
  const adjacency = buildRoutingGraph(
    graph.edges,
    temps.edges,
    hour,
    temps.meta.lambda_detour,
    temps.meta.baseline_c,
    temperatureOffsetC,
    liveEdgeTemps,
  )
  const schoolNode = nearestNode(graph.nodes, schoolPoint, adjacency.keys())
  const originNode = nearestNode(graph.nodes, originPoint, adjacency.keys())
  if (schoolNode === null || originNode === null) return null

  const shortestResult = dijkstra(adjacency, schoolNode, 'len_m')
  const shortestPath = reconstructPath(shortestResult, schoolNode, originNode)
  const coolestResult = dijkstra(adjacency, schoolNode, 'weight_cool')
  const coolestPath = reconstructPath(coolestResult, schoolNode, originNode)
  if (shortestPath === null || coolestPath === null) return null

  const shortest = buildLeg(graph, adjacency, shortestPath)
  const coolest = buildLeg(graph, adjacency, coolestPath)
  const alternatePaths = findAlternateRoutes(adjacency, schoolNode, originNode, [shortestPath, coolestPath])
  const alternates = alternatePaths.map((path) => buildLeg(graph, adjacency, path))

  return { originNode, schoolNode, shortest, coolest, alternates }
}
