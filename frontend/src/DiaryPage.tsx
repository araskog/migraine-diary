import { useState } from 'react'
import { Button, Group, Stack, Text, Title } from '@mantine/core'
import AppHeader from './AppHeader'
import ErrorMessages from './ErrorMessages'
import DiaryEntries from './DiaryEntries'
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
  const [saving, setSaving] = useState(false)
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
    <>
      <AppHeader>
        <Group gap="sm">
          <Text c="dimmed" size="sm" className="identity">
            Signed in as <strong>{email}</strong>
          </Text>
          <Button
            variant="light"
            disabled={busy || saving}
            onClick={() => {
              void signOut()
            }}
          >
            {busy ? 'Signing out…' : 'Sign out'}
          </Button>
        </Group>
      </AppHeader>
      <Stack component="section" gap="lg" className="page">
        <Title order={1}>Your diary</Title>
        <DiaryEntries
          csrfToken={csrfToken}
          disabled={busy || saving}
          onSavingChange={setSaving}
          onSignedOut={onSignedOut}
          onSessionRefreshed={onSessionRefreshed}
        />
        <ErrorMessages messages={errors} />
      </Stack>
    </>
  )
}
