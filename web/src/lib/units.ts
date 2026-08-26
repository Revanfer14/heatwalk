const METERS_PER_MILE = 1609.34
const FAHRENHEIT_MULTIPLIER = 9 / 5
const FAHRENHEIT_OFFSET = 32
const DEFAULT_TEMPERATURE_FRACTION_DIGITS = 1
const DEFAULT_DOSE_FRACTION_DIGITS = 1
const DEFAULT_DISTANCE_FRACTION_DIGITS = 2

export function celsiusToFahrenheit(celsius: number): number {
  return celsius * FAHRENHEIT_MULTIPLIER + FAHRENHEIT_OFFSET
}

export function metersToMiles(meters: number): number {
  return meters / METERS_PER_MILE
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
  fractionDigits: number = DEFAULT_DISTANCE_FRACTION_DIGITS,
): string {
  return `${miles.toFixed(fractionDigits)} mi`
}
