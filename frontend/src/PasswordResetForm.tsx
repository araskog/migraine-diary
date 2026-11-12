import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Stack, Text, TextInput, Title } from '@mantine/core'
import ErrorMessages from './ErrorMessages'
import { confirmPasswordReset } from './passwordReset'
import type { ResetLink } from './passwordReset'
import { getSession } from './session'
import type { Session } from './session'

type PasswordResetFormProps = {
  link: ResetLink | null
  csrfToken: string
  onBack: () => void
  onSessionRefreshed: (session: Session) => void
}

export default function PasswordResetForm({
  link,
  csrfToken,
  onBack,
  onSessionRefreshed,
}: PasswordResetFormProps) {
  const [busy, setBusy] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!link || busy) return
    const data = new FormData(event.currentTarget)
    const password = data.get('password')
    const confirmation = data.get('confirmation')
    if (typeof password !== 'string' || typeof confirmation !== 'string') return
    if (password !== confirmation) {
      setErrors(['The passwords do not match.'])
      return
    }
    setBusy(true)
    setErrors([])
    try {
      await confirmPasswordReset(link, password, confirmation, csrfToken)
      setCompleted(true)
      try {
        onSessionRefreshed(await getSession())
      } catch {
        /* The password was saved; keep success visible. */
      }
    } catch (error) {
      setErrors([
        error instanceof Error
          ? error.message
          : 'Unable to reset your password. Please try again.',
      ])
      try {
        onSessionRefreshed(await getSession())
      } catch {
        /* Keep the entered passwords for retry. */
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack component="section" gap="lg" className="page">
      <Title order={1}>Choose a new password</Title>
      {completed ? (
        <Text role="status">
          Your password has been updated. Sign in with your new password.
        </Text>
      ) : !link ? (
        <Text role="alert">
          This reset link is invalid. Go back to sign in and request a new one.
        </Text>
      ) : (
        <form
          onSubmit={(event) => {
            void submit(event)
          }}
        >
          <Stack gap="lg">
            <TextInput
              name="password"
              label="New password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={1024}
              size="md"
              disabled={busy}
              aria-describedby="reset-password-help"
            />
            <Text id="reset-password-help" size="xs" c="dimmed">
              Use at least 8 characters. Avoid common passwords, only numbers,
              or a password similar to your email.
            </Text>
            <TextInput
              name="confirmation"
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={1024}
              size="md"
              disabled={busy}
            />
            <ErrorMessages messages={errors} />
            <Button type="submit" size="md" disabled={busy}>
              {busy ? 'Saving…' : 'Save new password'}
            </Button>
          </Stack>
        </form>
      )}
      <Button variant="subtle" disabled={busy} onClick={onBack}>
        Back to sign in
      </Button>
    </Stack>
  )
}
