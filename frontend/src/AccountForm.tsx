import { useEffect, useState } from 'react'
import {
  Button,
  Checkbox,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  VisuallyHidden,
} from '@mantine/core'
import type { FormEvent } from 'react'
import ErrorMessages from './ErrorMessages'
import PrivacyNotice, { privacyVersion } from './PrivacyNotice'
import { getSession, isSession } from './session'
import type { Session } from './session'

type AccountFormProps = {
  initialMode?: 'sign-in' | 'register'
  csrfToken: string
  demoBusy?: boolean
  demoErrors?: string[]
  onAuthenticated: (session: Session) => void
  onSessionRefreshed: (session: Session) => void
  onBusyChange?: (busy: boolean) => void
}

function responseErrors(body: unknown, status: number): string[] {
  if (status === 403)
    return [
      'Your session security check expired. Please try again. If it continues, refresh the page.',
    ]
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

export default function AccountForm({
  initialMode = 'sign-in',
  csrfToken,
  demoBusy = false,
  demoErrors = [],
  onAuthenticated,
  onSessionRefreshed,
  onBusyChange,
}: AccountFormProps) {
  const [mode, setMode] = useState<'sign-in' | 'register'>(initialMode)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const inactive = busy || demoBusy

  useEffect(() => {
    onBusyChange?.(busy)
    return () => onBusyChange?.(false)
  }, [busy, onBusyChange])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inactive) return
    const form = event.currentTarget
    const values = new FormData(form)
    setBusy(true)
    setErrors([])
    try {
      const response = await fetch(`/api/${mode}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          email: values.get('email'),
          password: values.get('password'),
          ...(mode === 'register'
            ? {
                health_consent: values.get('health_consent') === 'on',
                privacy_policy_version: privacyVersion,
              }
            : {}),
        }),
      })
      const body: unknown = await response.json()
      if (!response.ok) {
        setErrors(responseErrors(body, response.status))
        onSessionRefreshed(await getSession())
        return
      }
      if (!isSession(body)) throw new Error('Unexpected response')
      form.reset()
      onAuthenticated(body)
    } catch {
      setErrors(['Unable to connect. Please try again.'])
    } finally {
      setBusy(false)
    }
  }

  const allErrors = [...demoErrors, ...errors]

  return (
    <Stack gap="md" className="account-shell">
      <Paper withBorder className="account-page">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={0}>
          <Stack gap="md" className="account-intro">
            <Title order={2}>Get to know your migraine patterns.</Title>
            <Text c="dimmed">
              Track migraine days over time and build a clearer picture of your
              experience.
            </Text>
          </Stack>
          <Stack gap="lg" className="account-form">
            <Stack gap="xs">
              <Title order={1}>
                {mode === 'register' ? 'Create your account' : 'Welcome back'}
              </Title>
              <Text c="dimmed">
                {mode === 'register'
                  ? 'Start with an email and password.'
                  : 'Sign in to open your diary.'}
              </Text>
            </Stack>
            <SegmentedControl
              size="lg"
              fullWidth
              bg="var(--app-control-background)"
              value={mode}
              disabled={inactive}
              aria-label="Account options"
              data={[
                { value: 'sign-in', label: 'Sign in' },
                { value: 'register', label: 'Create account' },
              ]}
              onChange={(value) => {
                if (value !== 'sign-in' && value !== 'register') return
                setMode(value)
                setErrors([])
              }}
            />
            <form
              onSubmit={(event) => {
                void submit(event)
              }}
            >
              <Stack gap="lg">
                <TextInput
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  size="md"
                  autoComplete="email"
                  required
                  maxLength={254}
                  disabled={inactive}
                />
                <Stack gap="xs">
                  <TextInput
                    key={mode}
                    id="password"
                    name="password"
                    label="Password"
                    type="password"
                    size="md"
                    autoComplete={
                      mode === 'register' ? 'new-password' : 'current-password'
                    }
                    required
                    maxLength={1024}
                    disabled={inactive}
                    aria-describedby={
                      mode === 'register' ? 'password-help' : undefined
                    }
                  />
                  <Text
                    id="password-help"
                    size="xs"
                    c="dimmed"
                    hidden={mode !== 'register'}
                  >
                    Use at least 8 characters. Avoid common passwords, only
                    numbers, or a password similar to your email.
                  </Text>
                </Stack>
                <PrivacyNotice />
                {mode === 'register' && (
                  <Checkbox
                    name="health_consent"
                    required
                    disabled={inactive}
                    label="I explicitly consent to Migraine Diary storing and using my health entries to provide my diary. I can withdraw consent by deleting my account."
                  />
                )}
                <ErrorMessages messages={allErrors} />
                <VisuallyHidden role="status">
                  {inactive
                    ? mode === 'register'
                      ? 'Creating account'
                      : 'Signing in'
                    : ''}
                </VisuallyHidden>
                <Button
                  size="md"
                  loading={busy}
                  aria-busy={inactive}
                  type="submit"
                >
                  {mode === 'register' ? 'Create account' : 'Sign in'}
                </Button>
              </Stack>
            </form>
          </Stack>
        </SimpleGrid>
      </Paper>
    </Stack>
  )
}
