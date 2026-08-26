export interface RouteColors {
  ink: string
  inkSubtle: string
  bg: string
  zoneSafe: string
  zoneReroute: string
  zoneBus: string
}

function readCssVariable(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export function getRouteColors(): RouteColors {
  return {
    ink: readCssVariable('--ink'),
    inkSubtle: readCssVariable('--ink-subtle'),
    bg: readCssVariable('--bg'),
    zoneSafe: readCssVariable('--zone-safe'),
    zoneReroute: readCssVariable('--zone-reroute'),
    zoneBus: readCssVariable('--zone-bus'),
  }
}
