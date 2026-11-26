import { WEEKDAY_LABELS } from './constants.ts'

/** Monday = 0 … Sunday = 6 (matches calendar `firstDayOfWeek={1}`). */
export function weekdayIndexFromDate(date: string): number {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay()
  return (day + 6) % 7
}

export function weekdayLabelFromDate(date: string): string {
  return WEEKDAY_LABELS[weekdayIndexFromDate(date)] ?? 'Unknown'
}
