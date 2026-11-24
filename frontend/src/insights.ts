export type InsightsSlice = {
  value: string | boolean
  label: string
  calendar_days: number
  recorded_days: number
  migraine_days: number
  migraine_rate: number | null
  sufficient_data: boolean
}

export type InsightsWeekdaySlice = {
  weekday: number
  label: string
  calendar_days: number
  recorded_days: number
  migraine_days: number
  migraine_rate: number | null
  sufficient_data: boolean
}

export type InsightsPainSlice = {
  value?: string
  medication_taken?: boolean
  label: string
  migraine_days: number
  average_pain_severity: number | null
  sufficient_data: boolean
}

export type DiaryInsights = {
  schema_version: number
  window_days: number
  today: string
  summary: {
    calendar_days: number
    recorded_days: number
    unrecorded_days: number
    migraine_days: number
    migraine_free_days: number
    migraine_rate: number | null
    insufficient_data: boolean
    minimum_recorded_days: number
  }
  coverage: {
    sleep_duration_answered: number
    sleep_quality_answered: number
    medication_answered: number
    pain_answered: number
  }
  weekdays: InsightsWeekdaySlice[]
  sleep_duration: InsightsSlice[]
  sleep_quality: InsightsSlice[]
  medication: InsightsSlice[]
  pain_by_sleep_duration: InsightsPainSlice[]
  pain_by_sleep_quality: InsightsPainSlice[]
  pain_by_medication: InsightsPainSlice[]
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isSlice(value: unknown): value is InsightsSlice {
  return (
    typeof value === 'object' &&
    value !== null &&
    'label' in value &&
    typeof value.label === 'string' &&
    'calendar_days' in value &&
    isNumber(value.calendar_days) &&
    'recorded_days' in value &&
    isNumber(value.recorded_days) &&
    'migraine_days' in value &&
    isNumber(value.migraine_days) &&
    'migraine_rate' in value &&
    (value.migraine_rate === null || isNumber(value.migraine_rate)) &&
    'sufficient_data' in value &&
    typeof value.sufficient_data === 'boolean'
  )
}

function isWeekdaySlice(value: unknown): value is InsightsWeekdaySlice {
  return (
    typeof value === 'object' &&
    value !== null &&
    'weekday' in value &&
    isNumber(value.weekday) &&
    isSlice(value)
  )
}

function isPainSlice(value: unknown): value is InsightsPainSlice {
  return (
    typeof value === 'object' &&
    value !== null &&
    'label' in value &&
    typeof value.label === 'string' &&
    'migraine_days' in value &&
    isNumber(value.migraine_days) &&
    'average_pain_severity' in value &&
    (value.average_pain_severity === null ||
      isNumber(value.average_pain_severity)) &&
    'sufficient_data' in value &&
    typeof value.sufficient_data === 'boolean'
  )
}

export function isDiaryInsights(value: unknown): value is DiaryInsights {
  if (typeof value !== 'object' || value === null) return false
  const body = value as Record<string, unknown>
  const summary = body.summary
  const coverage = body.coverage
  return (
    isNumber(body.schema_version) &&
    isNumber(body.window_days) &&
    typeof body.today === 'string' &&
    typeof summary === 'object' &&
    summary !== null &&
    'calendar_days' in summary &&
    isNumber(summary.calendar_days) &&
    'recorded_days' in summary &&
    isNumber(summary.recorded_days) &&
    'unrecorded_days' in summary &&
    isNumber(summary.unrecorded_days) &&
    'migraine_days' in summary &&
    isNumber(summary.migraine_days) &&
    'migraine_free_days' in summary &&
    isNumber(summary.migraine_free_days) &&
    'migraine_rate' in summary &&
    (summary.migraine_rate === null || isNumber(summary.migraine_rate)) &&
    'minimum_recorded_days' in summary &&
    isNumber(summary.minimum_recorded_days) &&
    'insufficient_data' in summary &&
    typeof summary.insufficient_data === 'boolean' &&
    typeof coverage === 'object' &&
    coverage !== null &&
    'sleep_duration_answered' in coverage &&
    isNumber(coverage.sleep_duration_answered) &&
    'sleep_quality_answered' in coverage &&
    isNumber(coverage.sleep_quality_answered) &&
    'medication_answered' in coverage &&
    isNumber(coverage.medication_answered) &&
    'pain_answered' in coverage &&
    isNumber(coverage.pain_answered) &&
    Array.isArray(body.weekdays) &&
    body.weekdays.every(isWeekdaySlice) &&
    Array.isArray(body.sleep_duration) &&
    body.sleep_duration.every(isSlice) &&
    Array.isArray(body.sleep_quality) &&
    body.sleep_quality.every(isSlice) &&
    Array.isArray(body.medication) &&
    body.medication.every(isSlice) &&
    Array.isArray(body.pain_by_sleep_duration) &&
    body.pain_by_sleep_duration.every(isPainSlice) &&
    Array.isArray(body.pain_by_sleep_quality) &&
    body.pain_by_sleep_quality.every(isPainSlice) &&
    Array.isArray(body.pain_by_medication) &&
    body.pain_by_medication.every(isPainSlice)
  )
}

export async function loadInsights(
  signal: AbortSignal,
): Promise<DiaryInsights> {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const response = await fetch(
    `/api/diary/insights/?timezone=${encodeURIComponent(timezone)}`,
    { cache: 'no-store', signal },
  )
  const body: unknown = await response.json()
  if (!response.ok || !isDiaryInsights(body))
    throw new Error('Unable to load pattern insights.')
  return body
}

export function formatRate(rate: number | null): string {
  if (rate === null) return '—'
  return `${Math.round(rate * 100)}%`
}

export function formatShareLabel(calendarDays: number): string {
  return `Share of ${calendarDays} days`
}
