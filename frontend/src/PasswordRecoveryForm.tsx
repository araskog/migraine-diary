import { useState } from 'react'
import {
  Anchor,
  Button,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  VisuallyHidden,
} from '@mantine/core'
import type { FormEvent } from 'react'
import ErrorMessages from './ErrorMessages'
import {
  PASSWORD_RECOVERY_CONFIRMATION,
  submitPasswordRecovery,
} from './passwordRecovery'

type PasswordRecoveryFormProps = {
  csrfToken: string
  disabled?: boolean
  onBack: () => void
}

export default function PasswordRecoveryForm({
  csrfToken,
  disabled = false,
  onBack,
}: PasswordRecoveryFormProps) {
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const inactive = busy || disabled

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inactive || submitted) return
    const values = new FormData(event.currentTarget)
    const email = values.get('email')
    if (typeof email !== 'string' || !email) return
    setBusy(true)
    setErrors([])
    try {
      const result = await submitPasswordRecovery(email, csrfToken)
      if (!result.ok) {
        setErrors(result.errors)
        return
      }
      setSubmitted(true)
    } finally {
      setBusy(false)
    }
  }

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
              <Title order={1}>Password help</Title>
              <Text c="dimmed">
                Submit the email for your account. Recovery is handled manually;
                we do not send an automated reset email.
              </Text>
            </Stack>
            {submitted ? (
              <Stack gap="md">
                <Text>{PASSWORD_RECOVERY_CONFIRMATION}</Text>
                <Button variant="light" onClick={onBack}>
                  Back to sign in
                </Button>
              </Stack>
            ) : (
              <form
                onSubmit={(event) => {
                  void submit(event)
                }}
              >
                <Stack gap="lg">
                  <TextInput
                    id="recovery-email"
                    name="email"
                    label="Email"
                    type="email"
                    size="md"
                    autoComplete="email"
                    required
                    maxLength={254}
                    disabled={inactive}
                  />
                  <ErrorMessages messages={errors} />
                  <VisuallyHidden role="status">
                    {busy ? 'Submitting password help request' : ''}
                  </VisuallyHidden>
                  <Button
                    size="md"
                    loading={busy}
                    aria-busy={inactive}
                    type="submit"
                  >
                    Request password help
                  </Button>
                  <Anchor
                    component="button"
                    type="button"
                    fs="italic"
                    c="dimmed"
                    size="sm"
                    disabled={inactive}
                    onClick={onBack}
                  >
                    Back to sign in
                  </Anchor>
                </Stack>
              </form>
            )}
          </Stack>
        </SimpleGrid>
      </Paper>
    </Stack>
  )
}
