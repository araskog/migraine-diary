import { useState } from 'react'
import { Button, Stack, Text } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
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

  const retryAction = canRetry && (
    <Button
      size="md"
      aria-disabled={disabled}
      onClick={() => {
        void save(status)
      }}
    >
      Try again
    </Button>
  )

  if (confirmFree)
    return (
      <Stack gap="sm" aria-busy={disabled}>
        <Text size="sm">
          Changing to migraine-free removes this day’s pain rating. Your other
          answers stay.
        </Text>
        <Button
          variant="default"
          aria-disabled={disabled}
          onClick={() => {
            if (disabled) return
            setStatus(entry?.status ?? '')
            setErrors([])
            setCanRetry(false)
            setConfirmFree(false)
          }}
        >
          Keep migraine
        </Button>
        <Button
          aria-disabled={disabled}
          onClick={() => void save('migraine_free')}
        >
          Mark migraine-free
        </Button>
        <ErrorMessages messages={errors} />
        {retryAction}
      </Stack>
    )

  return (
    <Stack gap="xs" aria-busy={disabled}>
      <Stack gap="xs">
        <Button
          variant="subtle"
          justify="flex-start"
          leftSection={
            <Text span c="var(--app-migraine)" aria-hidden>
              ●
            </Text>
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
            leftSection={<IconX size={14} stroke={1.8} aria-hidden />}
            onClick={() => void save('')}
          >
            Clear day
          </Button>
        )}
      </Stack>
      <ErrorMessages messages={errors} />
      {retryAction}
    </Stack>
  )
}
