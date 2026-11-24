import { useState } from 'react'
import {
  Button,
  Checkbox,
  Modal,
  Stack,
  Text,
  TextInput,
  VisuallyHidden,
} from '@mantine/core'
import type { FormEvent } from 'react'
import ErrorMessages from './ErrorMessages'
import PrivacyNotice, { privacyVersion } from './PrivacyNotice'
import { getSession, isSession } from './session'
import type { Session } from './session'

type DemoConvertFormProps = {
  opened: boolean
  csrfToken: string
  busy?: boolean
  onClose: () => void
  onConverted: (session: Session) => void
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

export default function DemoConvertForm({
  opened,
  csrfToken,
  busy: parentBusy,
  onClose,
  onConverted,
  onSessionRefreshed,
}: DemoConvertFormProps) {
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || parentBusy) return
    const values = new FormData(event.currentTarget)
    setBusy(true)
    setErrors([])
    try {
      const response = await fetch('/api/demo/convert/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          email: values.get('email'),
          password: values.get('password'),
          health_consent: values.get('health_consent') === 'on',
          privacy_policy_version: privacyVersion,
        }),
      })
      const body: unknown = await response.json()
      if (!response.ok) {
        setErrors(responseErrors(body, response.status))
        onSessionRefreshed(await getSession())
        return
      }
      if (!isSession(body)) throw new Error('Unexpected response')
      onConverted(body)
      onClose()
    } catch {
      setErrors(['Unable to connect. Please try again.'])
    } finally {
      setBusy(false)
    }
  }

  const disabled = busy || parentBusy

  return (
    <Modal
      opened={opened}
      onClose={() => {
        if (!disabled) onClose()
      }}
      title="Keep your demo diary"
    >
      <form
        onSubmit={(event) => {
          void submit(event)
        }}
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Add an email and password to turn this demo into your account. Your
            entries stay exactly where they are.
          </Text>
          <TextInput
            id="convert-email"
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            disabled={disabled}
          />
          <TextInput
            id="convert-password"
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            maxLength={1024}
            disabled={disabled}
            aria-describedby="convert-password-help"
          />
          <Text id="convert-password-help" size="xs" c="dimmed">
            Use at least 8 characters. Avoid common passwords, only numbers, or
            a password similar to your email.
          </Text>
          <PrivacyNotice />
          <Checkbox
            name="health_consent"
            required
            disabled={disabled}
            label="I explicitly consent to Migraine Diary storing and using my health entries to provide my diary. I can withdraw consent by deleting my account."
          />
          <ErrorMessages messages={errors} />
          <VisuallyHidden role="status">
            {busy ? 'Creating account from demo' : ''}
          </VisuallyHidden>
          <Button type="submit" loading={busy} disabled={disabled}>
            Create account
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
