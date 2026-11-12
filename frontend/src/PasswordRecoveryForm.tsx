import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Stack, Text, TextInput, Title } from '@mantine/core'
import ErrorMessages from './ErrorMessages'
import { requestPasswordReset } from './passwordReset'
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
    if (typeof email !== 'string') return
    setBusy(true)
    setErrors([])
    try {
      await requestPasswordReset(email, csrfToken)
      setSent(true)
    } catch (error) {
      setErrors([
        error instanceof Error
          ? error.message
          : 'Unable to send your request. Please try again.',
      ])
      try {
        onSessionRefreshed(await getSession())
      } catch {
        /* Keep the form available for retry. */
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack component="section" gap="lg" className="page">
      <Title order={1}>Reset your password</Title>
      {sent ? (
        <Text role="status">
          If an account exists for that email, we will send a reset link. Check
          your inbox and spam folder. If it does not arrive, try again later.
        </Text>
      ) : (
        <>
          <Text c="dimmed">
            Enter your account email and we will send you a password-reset link.
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
                {busy ? 'Sending…' : 'Send reset link'}
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
