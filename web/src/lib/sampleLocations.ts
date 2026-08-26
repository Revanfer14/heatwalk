export interface SampleLocation {
  id: string
  label: string
  lon: number
  lat: number
}

export const SAMPLE_LOCATIONS: SampleLocation[] = [
  { id: 'mercy_dr', label: '1420 Mercy Dr, Orlando', lon: -81.452, lat: 28.585 },
  { id: 'pine_hills_silver_star', label: 'Pine Hills Rd & Silver Star Rd', lon: -81.46, lat: 28.595 },
  { id: 'rosemont', label: 'Rosemont, Orlando', lon: -81.442, lat: 28.602 },
  { id: 'mercy_rio_grande', label: 'Mercy Dr & N Rio Grande Ave', lon: -81.448, lat: 28.58 },
  { id: 'silver_star_powers', label: 'Silver Star Rd & N Powers Dr', lon: -81.465, lat: 28.6 },
]
