import { useState } from 'react'
import { Button, Paper, Stack, Text, Title } from '@mantine/core'
import ErrorMessages from './ErrorMessages'
import { getSession, isSession } from './session'
import type { Session } from './session'

type DiaryPageProps = {
  email: string
  csrfToken: string
  onSignedOut: (session: Session) => void
  onSessionRefreshed: (session: Session) => void
}

export default function DiaryPage({
  email,
  csrfToken,
  onSignedOut,
  onSessionRefreshed,
}: DiaryPageProps) {
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  async function signOut() {
    if (busy) return
    setBusy(true)
    setErrors([])
    try {
      const response = await fetch('/api/sign-out/', {
        method: 'POST',
        headers: { 'X-CSRFToken': csrfToken },
      })
      const body: unknown = await response.json()
      if (!response.ok) {
        const current = await getSession()
        if (current.user === null) {
          onSignedOut(current)
          return
        }
        onSessionRefreshed(current)
        throw new Error('Sign-out failed')
      }
      if (!isSession(body) || body.user !== null)
        throw new Error('Unexpected response')
      onSignedOut(body)
    } catch {
      setErrors(['Unable to sign out. Please try again.'])
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack component="section" gap="lg" className="page">
      <Stack gap="xs">
        <Text size="sm" c="dimmed">
          Your space
        </Text>
        <Title order={1}>Your diary</Title>
        <Text c="dimmed" className="identity">
          Signed in as <strong>{email}</strong>
        </Text>
      </Stack>
      <Paper withBorder p="lg">
        <Stack gap="sm">
          <Title order={2} size="h4">
            A place to keep track
          </Title>
          <Text c="dimmed">
            Your account is ready. Recording migraine days and migraine-free
            days is coming in the next diary increment.
          </Text>
        </Stack>
      </Paper>
      <ErrorMessages messages={errors} />
      <Button
        size="md"
        variant="light"
        disabled={busy}
        onClick={() => {
          void signOut()
        }}
      >
        {busy ? 'Signing out…' : 'Sign out'}
      </Button>
    </Stack>
  )
}
