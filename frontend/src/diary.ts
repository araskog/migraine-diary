export type DiaryStatus = 'migraine' | 'migraine_free'
export type DiaryDetails = {
  medication_taken: boolean | null
  medication_name: string
  sleep: '' | 'poor' | 'okay' | 'good'
  pain_severity: number | null
}
export type DiaryEntry = { date: string; status: DiaryStatus } & DiaryDetails

export function emptyDetails(): DiaryDetails {
  return {
    medication_taken: null,
    medication_name: '',
    sleep: '',
    pain_severity: null,
  }
}

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function isDiaryDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false
  const date = new Date(`${value}T00:00:00Z`)
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}

export function dateLabel(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(
    new Date(`${value}T12:00:00`),
  )
}

export function statusLabel(status?: DiaryStatus): string {
  return status === 'migraine'
    ? 'Migraine'
    : status === 'migraine_free'
      ? 'Migraine-free'
      : 'Unrecorded'
}

function isEntry(value: unknown): value is DiaryEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'date' in value &&
    isDiaryDate(value.date) &&
    'status' in value &&
    (value.status === 'migraine' || value.status === 'migraine_free') &&
    'medication_taken' in value &&
    (value.medication_taken === null ||
      typeof value.medication_taken === 'boolean') &&
    'medication_name' in value &&
    typeof value.medication_name === 'string' &&
    'sleep' in value &&
    typeof value.sleep === 'string' &&
    ['', 'poor', 'okay', 'good'].includes(value.sleep) &&
    'pain_severity' in value &&
    (value.pain_severity === null ||
      (typeof value.pain_severity === 'number' &&
        Number.isInteger(value.pain_severity) &&
        value.pain_severity >= 0 &&
        value.pain_severity <= 10))
  )
}

export async function loadEntries(signal: AbortSignal): Promise<DiaryEntry[]> {
  const response = await fetch('/api/diary/entries/', {
    cache: 'no-store',
    signal,
  })
  const body: unknown = await response.json()
  if (!response.ok || !Array.isArray(body) || !body.every(isEntry))
    throw new Error('Unable to load diary days.')
  return body
}

export async function saveEntry(
  date: string,
  status: DiaryStatus,
  csrfToken: string,
  details?: DiaryDetails,
): Promise<DiaryEntry> {
  const response = await fetch('/api/diary/entries/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify({
      date,
      status,
      ...details,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  })
  const body: unknown = await response.json()
  if (!response.ok || !isEntry(body))
    throw new Error('Unable to save diary day.')
  return body
}
