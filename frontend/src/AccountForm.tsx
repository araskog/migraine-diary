import { useState } from 'react'
import {
  Button,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import type { FormEvent } from 'react'
import ErrorMessages from './ErrorMessages'
import { getSession, isSession } from './session'
import type { Session } from './session'

type AccountFormProps = {
  csrfToken: string
  onAuthenticated: (session: Session) => void
  onSessionRefreshed: (session: Session) => void
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
  csrfToken,
  onAuthenticated,
  onSessionRefreshed,
}: AccountFormProps) {
  const [mode, setMode] = useState<'sign-in' | 'register'>('sign-in')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
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

  return (
    <section className="account-page">
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
          disabled={busy}
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
              disabled={busy}
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
                disabled={busy}
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
                Use at least 8 characters. Avoid common passwords, only numbers,
                or a password similar to your email.
              </Text>
            </Stack>
            <ErrorMessages messages={errors} />
            <Button size="md" loading={busy} type="submit">
              {mode === 'register' ? 'Create account' : 'Sign in'}
            </Button>
          </Stack>
        </form>
      </Stack>
    </section>
  )
}
