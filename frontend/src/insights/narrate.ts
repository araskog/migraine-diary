import type { InsightFact } from './types.ts'

type NarrateResponse =
  | { lines: string[]; useFallback?: undefined }
  | { useFallback: true; lines?: undefined }

export async function fetchNarratedInsightLines(
  fingerprint: string,
  facts: InsightFact[],
  csrfToken: string,
  signal?: AbortSignal,
): Promise<string[] | null> {
  if (facts.length === 0) return null
  try {
    const response = await fetch('/api/insights/narrate/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({ fingerprint, facts }),
      cache: 'no-store',
      signal,
    })
    const body: unknown = await response.json()
    if (!response.ok) return null
    if (
      typeof body !== 'object' ||
      body === null ||
      !('useFallback' in body || 'lines' in body)
    ) {
      return null
    }
    const parsed = body as NarrateResponse
    if (parsed.useFallback) return null
    if (
      !Array.isArray(parsed.lines) ||
      !parsed.lines.every((line) => typeof line === 'string')
    ) {
      return null
    }
    return parsed.lines.filter((line) => line.trim().length > 0).slice(0, 3)
  } catch {
    return null
  }
}
