import type { PhaseADiaryDetails } from './diary'

const STORAGE_PREFIX = 'migraine-diary-phase-a:'

function storageKey(date: string): string {
  return `${STORAGE_PREFIX}${date}`
}

function emptyPhaseA(): PhaseADiaryDetails {
  return { symptoms: [], personal_note: '' }
}

function isPhaseA(value: unknown): value is PhaseADiaryDetails {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  if (!Array.isArray(record.symptoms)) return false
  if (!record.symptoms.every((item) => typeof item === 'string')) return false
  if (typeof record.personal_note !== 'string') return false
  if (record.personal_note.length > 2000) return false
  return true
}

function normalizePhaseA(value: Record<string, unknown>): PhaseADiaryDetails {
  const symptoms = Array.isArray(value.symptoms)
    ? value.symptoms.filter((item) => typeof item === 'string')
    : []
  const personal_note =
    typeof value.personal_note === 'string' ? value.personal_note : ''
  if (personal_note.length > 2000) return emptyPhaseA()
  return { symptoms, personal_note }
}

export function readPhaseAStorage(date: string): PhaseADiaryDetails {
  try {
    const raw = localStorage.getItem(storageKey(date))
    if (raw === null) return emptyPhaseA()
    const parsed: unknown = JSON.parse(raw)
    if (isPhaseA(parsed)) return parsed
    if (typeof parsed === 'object' && parsed !== null)
      return normalizePhaseA(parsed as Record<string, unknown>)
    return emptyPhaseA()
  } catch {
    return emptyPhaseA()
  }
}

export function writePhaseAStorage(
  date: string,
  value: PhaseADiaryDetails,
): void {
  try {
    localStorage.setItem(storageKey(date), JSON.stringify(value))
  } catch {
    // Quota or private mode; UI still holds answers until reload.
  }
}

export function clearPhaseAStorage(date: string): void {
  try {
    localStorage.removeItem(storageKey(date))
  } catch {
    // Ignore storage errors on clear.
  }
}

export function phaseAFromDetails(
  details: PhaseADiaryDetails,
): PhaseADiaryDetails {
  return {
    symptoms: [...details.symptoms],
    personal_note: details.personal_note,
  }
}
