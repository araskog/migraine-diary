import { useEffect, useState } from 'react'
import { Button, Container, Stack, Text, Title } from '@mantine/core'
import AccountForm from './AccountForm'
import AppHeader from './AppHeader'
import DiaryPage from './DiaryPage'
import PasswordResetForm from './PasswordResetForm'
import { readResetLink } from './passwordReset'
import { getSession } from './session'
import type { Session } from './session'
import './App.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [page, setPage] = useState<
    'loading' | 'account' | 'diary' | 'unavailable'
  >('loading')
  const [notice, setNotice] = useState('')
  const [resetLink, setResetLink] = useState(() =>
    readResetLink(window.location.hash),
  )
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    function receiveResetLink() {
      const link = readResetLink(window.location.hash)
      if (link !== undefined) {
        setResetLink(link)
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search,
        )
      }
    }
    if (resetLink !== undefined)
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search,
      )
    window.addEventListener('hashchange', receiveResetLink)
    return () => window.removeEventListener('hashchange', receiveResetLink)
  }, [resetLink])

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

  function finishSignOut(next: Session) {
    setSession(next)
    setPage('account')
    setNotice('You have signed out.')
  }

  return (
    <Container component="main" size={960} px="lg" py="xl" className="app">
      {(page !== 'diary' || resetLink !== undefined) && <AppHeader />}
      {page === 'loading' && (
        <Text role="status" mt="xl">
          Checking your session…
        </Text>
      )}
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
      {resetLink === undefined && page === 'account' && session && (
        <AccountForm
          csrfToken={session.csrfToken}
          notice={notice}
          onAuthenticated={openDiary}
          onSessionRefreshed={setSession}
        />
      )}
      {resetLink === undefined && page === 'diary' && session?.user && (
        <DiaryPage
          email={session.user.email}
          csrfToken={session.csrfToken}
          onSignedOut={finishSignOut}
          onSessionRefreshed={setSession}
        />
      )}
      {resetLink !== undefined &&
        session &&
        page !== 'loading' &&
        page !== 'unavailable' && (
          <PasswordResetForm
            key={
              resetLink
                ? `${resetLink.uid}:${resetLink.token}`
                : 'invalid-reset-link'
            }
            link={resetLink}
            csrfToken={session.csrfToken}
            onSessionRefreshed={setSession}
            onBack={() => {
              setResetLink(undefined)
              setPage('account')
              setNotice('')
            }}
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
