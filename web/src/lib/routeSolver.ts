import type { SchoolGraph, SchoolTemps, SolvedRouteLeg, SolvedRoutes } from '@/lib/types'
import { buildRoutingGraph } from '@/lib/routeGraph'
import { dijkstra, reconstructPath } from '@/lib/dijkstra'
import { summarizeRoute } from '@/lib/routeStats'
import { buildRouteGeometry } from '@/lib/routeGeometry'
import { nearestNode } from '@/lib/nearestNode'
import type { LonLat } from '@/lib/geoDistance'

export function solveRoutes(
  graph: SchoolGraph,
  temps: SchoolTemps,
  schoolPoint: LonLat,
  originPoint: LonLat,
  hour: string,
): SolvedRoutes | null {
  const adjacency = buildRoutingGraph(graph.edges, temps.edges, hour, temps.meta.lambda_detour)
  const schoolNode = nearestNode(graph.nodes, schoolPoint, adjacency.keys())
  const originNode = nearestNode(graph.nodes, originPoint, adjacency.keys())
  if (schoolNode === null || originNode === null) return null

  const shortestResult = dijkstra(adjacency, schoolNode, 'len_m')
  const shortestPath = reconstructPath(shortestResult, schoolNode, originNode)
  const coolestResult = dijkstra(adjacency, schoolNode, 'weight_cool')
  const coolestPath = reconstructPath(coolestResult, schoolNode, originNode)
  if (shortestPath === null || coolestPath === null) return null

  const toLeg = (schoolToOriginPath: string[]): SolvedRouteLeg => {
    const originToSchoolPath = [...schoolToOriginPath].reverse()
    const stats = summarizeRoute(adjacency, originToSchoolPath)
    const geometry = buildRouteGeometry(graph.nodes, graph.edges, adjacency, originToSchoolPath)
    return { ...stats, geometry }
  }

  return {
    originNode,
    schoolNode,
    shortest: toLeg(shortestPath),
    coolest: toLeg(coolestPath),
  }
}

export function coolestDoseAcrossHours(
  graph: SchoolGraph,
  temps: SchoolTemps,
  schoolPoint: LonLat,
  originPoint: LonLat,
): Record<string, number> {
  const doseByHour: Record<string, number> = {}

  for (const hour of temps.meta.hours) {
    const adjacency = buildRoutingGraph(graph.edges, temps.edges, hour, temps.meta.lambda_detour)
    const schoolNode = nearestNode(graph.nodes, schoolPoint, adjacency.keys())
    const originNode = nearestNode(graph.nodes, originPoint, adjacency.keys())
    if (schoolNode === null || originNode === null) continue

    const coolestResult = dijkstra(adjacency, schoolNode, 'weight_cool')
    const coolestPath = reconstructPath(coolestResult, schoolNode, originNode)
    if (coolestPath === null) continue

    doseByHour[hour] = summarizeRoute(adjacency, coolestPath).dose
  }

  return doseByHour
}
