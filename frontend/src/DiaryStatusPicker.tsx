import { useState } from 'react'
import { Button, Stack, Text } from '@mantine/core'
import ErrorMessages from './ErrorMessages'
import { clearEntry, localDate, saveEntry } from './diary'
import type { DiaryEntry, DiaryStatus } from './diary'
import { getSession } from './session'
import type { Session } from './session'

type DiaryStatusPickerProps = {
  date: string
  entry?: DiaryEntry
  csrfToken: string
  disabled: boolean
  onSaved: (entry: DiaryEntry) => void
  onCleared: () => void
  onSavingChange: (saving: boolean) => void
  onSignedOut: (session: Session) => void
  onSessionRefreshed: (session: Session) => void
}

export default function DiaryStatusPicker({
  date,
  entry,
  csrfToken,
  disabled,
  onSaved,
  onCleared,
  onSavingChange,
  onSignedOut,
  onSessionRefreshed,
}: DiaryStatusPickerProps) {
  const [status, setStatus] = useState<DiaryStatus | ''>(entry?.status ?? '')
  const [canClear] = useState(entry !== undefined)
  const [errors, setErrors] = useState<string[]>([])
  const [canRetry, setCanRetry] = useState(false)
  const [confirmFree, setConfirmFree] = useState(false)

  async function save(nextStatus: DiaryStatus | '') {
    if (disabled) return
    setStatus(nextStatus)
    setErrors([])
    if (date > localDate()) {
      setErrors(['Choose today or a past date.'])
      return
    }
    onSavingChange(true)
    try {
      if (nextStatus === '') {
        await clearEntry(date, csrfToken)
        onCleared()
      } else {
        const saved = await saveEntry(date, nextStatus, csrfToken)
        onSaved(saved)
      }
    } catch {
      setCanRetry(true)
      setErrors([
        'Unable to confirm this save. Your selection is kept; please try again.',
      ])
      try {
        const session = await getSession()
        if (session.user === null) onSignedOut(session)
        else onSessionRefreshed(session)
      } catch {
        // Preserve the selection for retry when the connection returns.
      }
    } finally {
      onSavingChange(false)
    }
  }

  if (confirmFree)
    return (
      <Stack gap="sm">
        <Text size="sm">
          Changing to migraine-free removes this day’s pain rating. Your other
          answers stay.
        </Text>
        <Button variant="default" onClick={() => setConfirmFree(false)}>
          Keep migraine
        </Button>
        <Button
          aria-disabled={disabled}
          onClick={() => {
            setConfirmFree(false)
            void save('migraine_free')
          }}
        >
          Mark migraine-free
        </Button>
      </Stack>
    )

  return (
    <Stack gap="xs" aria-busy={disabled}>
      <Stack gap={2}>
        <Button
          variant="subtle"
          justify="flex-start"
          leftSection={
            <span aria-hidden="true" style={{ color: 'var(--app-migraine)' }}>
              ●
            </span>
          }
          aria-pressed={status === 'migraine'}
          aria-disabled={disabled}
          onClick={() => void save('migraine')}
        >
          Migraine
        </Button>
        <Button
          variant="subtle"
          justify="flex-start"
          leftSection={<span aria-hidden="true">○</span>}
          aria-pressed={status === 'migraine_free'}
          aria-disabled={disabled}
          onClick={() => {
            if (disabled) return
            if (
              entry?.pain_severity !== null &&
              entry?.pain_severity !== undefined
            )
              setConfirmFree(true)
            else void save('migraine_free')
          }}
        >
          Migraine-free
        </Button>
        {canClear && (
          <Button
            variant="subtle"
            justify="flex-start"
            aria-disabled={disabled}
            leftSection={
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="m6 6 12 12M6 18 18 6" />
              </svg>
            }
            onClick={() => void save('')}
          >
            Clear day
          </Button>
        )}
      </Stack>
      <ErrorMessages messages={errors} />
      {canRetry && (
        <Button
          size="md"
          aria-disabled={disabled}
          onClick={() => {
            void save(status)
          }}
        >
          Try again
        </Button>
      )}
    </Stack>
  )
}
