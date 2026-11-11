import { useEffect, useState } from 'react'
import { Button, Container, Group, Stack, Text, Title } from '@mantine/core'
import AccountForm from './AccountForm'
import DiaryPage from './DiaryPage'
import { getSession } from './session'
import type { Session } from './session'
import './App.css'

async function checkDiary() {
  const response = await fetch('/api/diary/', { cache: 'no-store' })
  const body: unknown = await response.json()
  if (
    !response.ok ||
    typeof body !== 'object' ||
    body === null ||
    !('recordingAvailable' in body) ||
    body.recordingAvailable !== false
  )
    throw new Error('Diary unavailable')
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [page, setPage] = useState<
    'loading' | 'account' | 'diary' | 'unavailable'
  >('loading')
  const [notice, setNotice] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    async function restoreSession() {
      try {
        const next = await getSession()
        if (next.user) await checkDiary()
        if (active) {
          setSession(next)
          setPage(next.user ? 'diary' : 'account')
        }
      } catch {
        if (active) setPage('unavailable')
      }
    }
    void restoreSession()
    return () => {
      active = false
    }
  }, [attempt])

  async function openDiary(next: Session) {
    setSession(next)
    try {
      if (!next.user) throw new Error('Missing authenticated user')
      await checkDiary()
      setPage('diary')
    } catch {
      setPage('unavailable')
    }
  }

  function finishSignOut(next: Session) {
    setSession(next)
    setPage('account')
    setNotice('You have signed out.')
  }

  return (
    <Container component="main" size={960} px="lg" py="xl" className="app">
      <Group
        component="header"
        justify="space-between"
        gap="sm"
        className="app-header"
      >
        <Text fw={700} size="lg">
          Migraine Diary
        </Text>
        <Text c="dimmed" size="xs">
          Local preview · synthetic data only
        </Text>
      </Group>
      {page === 'loading' && (
        <Text role="status" mt="xl">
          Checking your session…
        </Text>
      )}
      {page === 'unavailable' && (
        <Stack component="section" gap="lg" className="page">
          <Title order={1}>Unable to connect</Title>
          <Text c="dimmed">
            Check that the local service is running, then try again.
          </Text>
          <Button
            size="md"
            onClick={() => {
              setPage('loading')
              setAttempt((value) => value + 1)
            }}
          >
            Try again
          </Button>
        </Stack>
      )}
      {page === 'account' && session && (
        <AccountForm
          csrfToken={session.csrfToken}
          notice={notice}
          onAuthenticated={openDiary}
          onSessionRefreshed={setSession}
        />
      )}
      {page === 'diary' && session?.user && (
        <DiaryPage
          email={session.user.email}
          csrfToken={session.csrfToken}
          onSignedOut={finishSignOut}
          onSessionRefreshed={setSession}
        />
      )}
    </Container>
  )
}
export default App
