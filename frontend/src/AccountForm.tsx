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
  notice: string
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
  notice,
  onAuthenticated,
  onSessionRefreshed,
}: AccountFormProps) {
  const [mode, setMode] = useState<'sign-in' | 'register'>('sign-in')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [showNotice, setShowNotice] = useState(true)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const values = new FormData(form)
    setBusy(true)
    setErrors([])
    setShowNotice(false)
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
    <Stack component="section" gap="lg" className="page">
      <Stack gap="xs">
        <Text size="sm" c="dimmed">
          A little space for you
        </Text>
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
        bg="sage.0"
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
          setShowNotice(false)
        }}
      />
      {showNotice && notice && (
        <Text role="status" c="sage.8">
          {notice}
        </Text>
      )}
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
              c="gray.7"
              aria-hidden={mode !== 'register'}
              style={{ visibility: mode === 'register' ? 'visible' : 'hidden' }}
            >
              Use at least 8 characters. Avoid common passwords, only numbers,
              or a password similar to your email.
            </Text>
          </Stack>
          <ErrorMessages messages={errors} />
          <Button size="md" disabled={busy} type="submit">
            {busy
              ? 'Please wait…'
              : mode === 'register'
                ? 'Create account'
                : 'Sign in'}
          </Button>
        </Stack>
      </form>
      <Text size="sm" c="dimmed">
        Password recovery is not available in this local preview yet.
      </Text>
    </Stack>
  )
}
