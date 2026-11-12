export type ResetLink = { uid: string; token: string }

export function readResetLink(hash: string): ResetLink | null | undefined {
  if (!hash.startsWith('#reset-password')) return undefined
  const match =
    /^#reset-password\/([A-Za-z0-9_-]{1,128})\/([A-Za-z0-9_-]{1,128})$/.exec(
      hash,
    )
  return match ? { uid: match[1], token: match[2] } : null
}

async function postReset(
  path: string,
  data: Record<string, string>,
  csrfToken: string,
): Promise<void> {
  let response: Response
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
      body: JSON.stringify(data),
    })
  } catch {
    throw new Error('Unable to connect. Please try again.')
  }
  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new Error('Unable to confirm this request. Please try again.')
  }
  if (response.ok) {
    if (
      typeof body === 'object' &&
      body !== null &&
      'detail' in body &&
      typeof body.detail === 'string'
    )
      return
    throw new Error('Unable to confirm this request. Please try again.')
  }
  if (response.status === 429)
    throw new Error('Too many requests. Please try again later.')
  const messages: string[] = []
  if (typeof body === 'object' && body !== null) {
    for (const value of Object.values(body)) {
      if (typeof value === 'string') messages.push(value)
      else if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'string') messages.push(item)
          else if (
            typeof item === 'object' &&
            item !== null &&
            'message' in item &&
            typeof item.message === 'string'
          )
            messages.push(item.message)
        }
      }
    }
  }
  throw new Error(messages.join(' ') || 'Unable to continue. Please try again.')
}

export function requestPasswordReset(
  email: string,
  csrfToken: string,
): Promise<void> {
  return postReset('/api/password-reset/', { email }, csrfToken)
}

export function confirmPasswordReset(
  link: ResetLink,
  password: string,
  confirmation: string,
  csrfToken: string,
): Promise<void> {
  return postReset(
    '/api/password-reset/confirm/',
    { ...link, new_password1: password, new_password2: confirmation },
    csrfToken,
  )
}
