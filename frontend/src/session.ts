export type Session = { user: { email: string } | null; csrfToken: string }

export function isSession(value: unknown): value is Session {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('csrfToken' in value) ||
    typeof value.csrfToken !== 'string' ||
    !('user' in value)
  )
    return false
  return (
    value.user === null ||
    (typeof value.user === 'object' &&
      'email' in value.user &&
      typeof value.user.email === 'string')
  )
}

export async function getSession(): Promise<Session> {
  const response = await fetch('/api/session/', { cache: 'no-store' })
  const body: unknown = await response.json()
  if (!response.ok || !isSession(body)) throw new Error('Session unavailable')
  return body
}
