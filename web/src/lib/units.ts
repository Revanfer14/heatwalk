const METERS_PER_MILE = 1609.34
const METERS_PER_KILOMETER = 1000
const FAHRENHEIT_MULTIPLIER = 9 / 5
const FAHRENHEIT_OFFSET = 32
const DEFAULT_TEMPERATURE_FRACTION_DIGITS = 1
const DEFAULT_DOSE_FRACTION_DIGITS = 0
const DEFAULT_MILES_FRACTION_DIGITS = 1
const DEFAULT_KILOMETERS_FRACTION_DIGITS = 2
const DEFAULT_PERCENT_FRACTION_DIGITS = 0

export function celsiusToFahrenheit(celsius: number): number {
  return celsius * FAHRENHEIT_MULTIPLIER + FAHRENHEIT_OFFSET
}

export function metersToMiles(meters: number): number {
  return meters / METERS_PER_MILE
}

export function metersToKilometers(meters: number): number {
  return meters / METERS_PER_KILOMETER
}

export function formatCelsius(
  celsius: number,
  fractionDigits: number = DEFAULT_TEMPERATURE_FRACTION_DIGITS,
): string {
  return `${celsius.toFixed(fractionDigits)}°C`
}

export function formatFahrenheit(
  fahrenheit: number,
  fractionDigits: number = DEFAULT_TEMPERATURE_FRACTION_DIGITS,
): string {
  return `${fahrenheit.toFixed(fractionDigits)}°F`
}

export function formatTemperaturePair(
  celsius: number,
  fractionDigits: number = DEFAULT_TEMPERATURE_FRACTION_DIGITS,
): string {
  const fahrenheit = celsiusToFahrenheit(celsius)
  return `${formatCelsius(celsius, fractionDigits)} / ${formatFahrenheit(fahrenheit, fractionDigits)}`
}

export function formatDose(
  doseCMin: number,
  fractionDigits: number = DEFAULT_DOSE_FRACTION_DIGITS,
): string {
  return `${doseCMin.toFixed(fractionDigits)}°C·min`
}

export function formatMiles(
  miles: number,
  fractionDigits: number = DEFAULT_MILES_FRACTION_DIGITS,
): string {
  return `${miles.toFixed(fractionDigits)} mi`
}

export function formatKilometers(
  kilometers: number,
  fractionDigits: number = DEFAULT_KILOMETERS_FRACTION_DIGITS,
): string {
  return `${kilometers.toFixed(fractionDigits)} km`
}

export function formatMinutes(minutes: number): string {
  return `${Math.round(minutes)} min`
}

export function formatPercent(
  percent: number,
  fractionDigits: number = DEFAULT_PERCENT_FRACTION_DIGITS,
): string {
  return `${percent.toFixed(fractionDigits)}%`
}

export function formatSignedPercent(
  percent: number,
  fractionDigits: number = DEFAULT_PERCENT_FRACTION_DIGITS,
): string {
  const sign = percent > 0 ? '+' : ''
  return `${sign}${percent.toFixed(fractionDigits)}%`
}

export function formatSignedTemperature(
  celsius: number,
  fractionDigits: number = DEFAULT_TEMPERATURE_FRACTION_DIGITS,
): string {
  const sign = celsius > 0 ? '+' : ''
  return `${sign}${celsius.toFixed(fractionDigits)}°C`
}

export function formatSignedMeters(meters: number): string {
  const sign = meters > 0 ? '+' : ''
  return `${sign}${Math.round(meters)} m`
}

export function formatSignedMinutes(minutes: number): string {
  const sign = minutes > 0 ? '+' : ''
  return `${sign}${Math.round(minutes)} min`
}

export function percentOf(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0
}

export function percentChange(current: number, baseline: number): number {
  return baseline > 0 ? ((current - baseline) / baseline) * 100 : 0
}

