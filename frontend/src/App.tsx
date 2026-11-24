import { useEffect, useState } from 'react'
import { Button, Container, Stack, Text, Title } from '@mantine/core'
import LoadingIndicator from './LoadingIndicator'
import AccountForm from './AccountForm'
import AppHeader from './AppHeader'
import DiaryPage from './DiaryPage'
import { getSession } from './session'
import type { Session } from './session'
import './App.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [page, setPage] = useState<
    'loading' | 'account' | 'diary' | 'unavailable'
  >('loading')
  const [attempt, setAttempt] = useState(0)
  const [accountMode, setAccountMode] = useState<'sign-in' | 'register'>(
    'sign-in',
  )

  useEffect(() => {
    let active = true
    async function restoreSession() {
      try {
        const next = await getSession()
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

  function openDiary(next: Session) {
    setSession(next)
    setPage(next.user ? 'diary' : 'account')
  }

  function finishSignOut(next: Session, options?: { register?: boolean }) {
    setSession(next)
    setAccountMode(options?.register ? 'register' : 'sign-in')
    setPage('account')
  }

  return (
    <Container component="main" size={960} px="lg" py="xl" className="app">
      {page !== 'diary' && <AppHeader />}
      {page === 'loading' && <LoadingIndicator fullPage />}
      {page === 'unavailable' && (
        <Stack component="section" gap="lg" className="page">
          <Title order={1}>Unable to connect</Title>
          <Text c="dimmed">Please try again in a moment.</Text>
          <Button
            size="md"
            variant="light"
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
          key={accountMode}
          initialMode={accountMode}
          csrfToken={session.csrfToken}
          onAuthenticated={openDiary}
          onSessionRefreshed={setSession}
        />
      )}
      {page === 'diary' && session?.user && (
        <DiaryPage
          email={session.user.email}
          isDemo={session.user.isDemo}
          csrfToken={session.csrfToken}
          onSignedOut={finishSignOut}
          onSessionRefreshed={setSession}
        />
      )}
      {import.meta.env.DEV && (
        <Text c="dimmed" size="xs" mt="xl" ta="center">
          Local preview · synthetic data only
        </Text>
      )}
    </Container>
  )
}
export default App
