/** Minimum migraine days before any pattern facts (and optional AI narrate). */
export const MIN_MIGRAINE_DAYS = 1
/** Minimum migraine days before sleep×weekday compound facts (needs a stable baseline). */
export const MIN_MIGRAINE_DAYS_COMPOUND = 5
export const MAX_INSIGHT_LINES = 3
export const MIN_COMPOUND_CELL_DAYS = 3
export const COMPOUND_LIFT_FACTOR = 1.5

export const WEEKDAY_LABELS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

export const SLEEP_DURATION_LABELS: Record<'less' | 'usual' | 'more', string> =
  {
    less: 'Less than usual',
    usual: 'Usual',
    more: 'More than usual',
  }

export const SLEEP_QUALITY_LABELS: Record<'poor' | 'okay' | 'good', string> = {
  poor: 'Poor',
  okay: 'Okay',
  good: 'Good',
}
