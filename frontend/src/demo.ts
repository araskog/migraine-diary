import { getSession, isSession, type Session } from './session'

export const DEMO_DISPLAY_NAME = 'Jane Doe'
export const DEMO_NOTICE_DESKTOP = 'Exploring the demo.'
export const DEMO_NOTICE_MOBILE = 'Demo diary'

function responseErrors(body: unknown, status: number): string[] {
  if (status === 403)
    return [
      'Your session security check expired. Please try again. If it continues, refresh the page.',
    ]
  const messages: string[] = []
  if (typeof body === 'object' && body !== null) {
    for (const value of Object.values(body)) {
      if (typeof value === 'string') messages.push(value)
      else if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'string') messages.push(item)
        }
      }
    }
  }
  return messages.length ? messages : ['Unable to continue. Please try again.']
}

export type StartDemoResult =
  { ok: true; session: Session } | { ok: false; errors: string[] }

export async function startDemoSession(
  csrfToken: string,
): Promise<StartDemoResult> {
  try {
    const response = await fetch('/api/demo/start/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    })
    const body: unknown = await response.json()
    if (!response.ok) {
      await getSession()
      return { ok: false, errors: responseErrors(body, response.status) }
    }
    if (!isSession(body)) throw new Error('Unexpected response')
    return { ok: true, session: body }
  } catch {
    return { ok: false, errors: ['Unable to connect. Please try again.'] }
  }
}
