export const PASSWORD_RECOVERY_CONFIRMATION =
  'If an account exists for that email, we recorded your request. ' +
  'The maintainer will contact you to verify your identity before resetting your password.'

function responseErrors(body: unknown): string[] {
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

export async function submitPasswordRecovery(
  email: string,
  csrfToken: string,
): Promise<{ ok: true; detail: string } | { ok: false; errors: string[] }> {
  let response: Response
  try {
    response = await fetch('/api/password-recovery/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({ email }),
    })
  } catch {
    return { ok: false, errors: ['Unable to connect. Please try again.'] }
  }
  const body: unknown = await response.json()
  if (!response.ok) {
    return { ok: false, errors: responseErrors(body) }
  }
  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as { detail?: unknown }).detail !== 'string'
  ) {
    return { ok: false, errors: ['Unexpected response. Please try again.'] }
  }
  return { ok: true, detail: (body as { detail: string }).detail }
}
