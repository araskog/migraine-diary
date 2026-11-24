export type SessionUser = { email: string; isDemo: boolean }

export type Session = { user: SessionUser | null; csrfToken: string }

export function isSessionUser(value: unknown): value is SessionUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    'email' in value &&
    typeof value.email === 'string' &&
    'isDemo' in value &&
    typeof value.isDemo === 'boolean'
  )
}

export function isSession(value: unknown): value is Session {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('csrfToken' in value) ||
    typeof value.csrfToken !== 'string' ||
    !('user' in value)
  )
    return false
  return value.user === null || isSessionUser(value.user)
}

export async function getSession(): Promise<Session> {
  const response = await fetch('/api/session/', { cache: 'no-store' })
  const body: unknown = await response.json()
  if (!response.ok || !isSession(body)) throw new Error('Session unavailable')
  return body
}
