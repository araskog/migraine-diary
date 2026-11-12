import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Stack, Text, TextInput, Title } from '@mantine/core'
import ErrorMessages from './ErrorMessages'
import { getSession } from './session'
import type { Session } from './session'

type PasswordRecoveryFormProps = {
  csrfToken: string
  onBack: () => void
  onSessionRefreshed: (session: Session) => void
}

export default function PasswordRecoveryForm({
  csrfToken,
  onBack,
  onSessionRefreshed,
}: PasswordRecoveryFormProps) {
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const email = new FormData(event.currentTarget).get('email')
    setBusy(true)
    setErrors([])
    try {
      const response = await fetch('/api/password-recovery/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) {
        setErrors([
          response.status === 429
            ? 'Too many requests. Please try again later.'
            : 'Unable to send your request. Please try again.',
        ])
        if (response.status === 403) onSessionRefreshed(await getSession())
        return
      }
      setSent(true)
    } catch {
      setErrors(['Unable to send your request. Please try again.'])
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack component="section" gap="lg" className="page">
      <Title order={1}>Password recovery</Title>
      {sent ? (
        <Text role="status">
          Request received. We will review it and contact you by email.
        </Text>
      ) : (
        <>
          <Text c="dimmed">
            Enter your account email to request help. Requests are reviewed
            manually.
          </Text>
          <form
            onSubmit={(event) => {
              void submit(event)
            }}
          >
            <Stack gap="lg">
              <TextInput
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                size="md"
                disabled={busy}
              />
              <ErrorMessages messages={errors} />
              <Button type="submit" size="md" disabled={busy}>
                {busy ? 'Sending…' : 'Request help'}
              </Button>
            </Stack>
          </form>
        </>
      )}
      <Button variant="subtle" disabled={busy} onClick={onBack}>
        Back to sign in
      </Button>
    </Stack>
  )
}
