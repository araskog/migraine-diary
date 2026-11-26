import type { DiaryEntry } from '../diary.ts'

export function buildInsightsFingerprint(entries: DiaryEntry[]): string {
  const migraine = entries
    .filter((entry) => entry.status === 'migraine')
    .map((entry) => ({
      date: entry.date,
      sleep_duration: entry.sleep_duration,
      sleep: entry.sleep,
      medication_taken: entry.medication_taken,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
  return JSON.stringify(migraine)
}

export async function hashInsightsFingerprint(
  fingerprint: string,
): Promise<string> {
  const data = new TextEncoder().encode(fingerprint)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

const CACHE_KEY = 'migraine-diary-insights-narrate'

type NarrateCacheEntry = {
  fingerprint: string
  lines: string[]
}

export function readNarrateCache(fingerprint: string): string[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as NarrateCacheEntry
    if (parsed.fingerprint !== fingerprint) return null
    return parsed.lines
  } catch {
    return null
  }
}

export function writeNarrateCache(fingerprint: string, lines: string[]): void {
  try {
    const entry: NarrateCacheEntry = { fingerprint, lines }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    /* sessionStorage may be unavailable */
  }
}
