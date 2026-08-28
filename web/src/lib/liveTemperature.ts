const SCHOOL_HOURS_START = '07:00'
const SCHOOL_HOURS_END = '16:00'

export function currentOrlandoHour(): string {
  const hourString = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    hour12: false,
  }).format(new Date())
  const hourNumber = Number.parseInt(hourString, 10) % 24
  return `${hourNumber.toString().padStart(2, '0')}:00`
}

export function clampToSchoolHour(hour: string): string {
  if (hour < SCHOOL_HOURS_START) return SCHOOL_HOURS_START
  if (hour > SCHOOL_HOURS_END) return SCHOOL_HOURS_END
  return hour
}

export function temperatureOffsetC(liveMedianC: number, modeledMedianC: number): number {
  return liveMedianC - modeledMedianC
}
