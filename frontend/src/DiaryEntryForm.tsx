import { useState } from 'react'
import { Button, Stack } from '@mantine/core'
import ErrorMessages from './ErrorMessages'
import { clearEntry, localDate, saveEntry } from './diary'
import type { DiaryEntry, DiaryStatus } from './diary'
import { getSession } from './session'
import type { Session } from './session'

type DiaryEntryFormProps = {
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

export default function DiaryEntryForm({
  date,
  entry,
  csrfToken,
  disabled,
  onSaved,
  onCleared,
  onSavingChange,
  onSignedOut,
  onSessionRefreshed,
}: DiaryEntryFormProps) {
  const [status, setStatus] = useState<DiaryStatus | ''>(entry?.status ?? '')
  // Keep this popup's actions stable through the save and closing transition.
  const [canClear] = useState(entry !== undefined)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  async function save(nextStatus: DiaryStatus | '') {
    if (saving || disabled) return
    setStatus(nextStatus)
    setErrors([])
    if (date > localDate()) {
      setErrors(['Choose today or a past date.'])
      return
    }
    setSaving(true)
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
      setErrors(['Unable to confirm this change. Please try again.'])
      try {
        const session = await getSession()
        if (session.user === null) onSignedOut(session)
        else onSessionRefreshed(session)
      } catch {
        // Preserve the selection for retry when the connection returns.
      }
    } finally {
      setSaving(false)
      onSavingChange(false)
    }
  }

  return (
    <Stack gap="xs">
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
          disabled={saving || disabled}
          onClick={() => void save('migraine')}
        >
          Migraine
        </Button>
        <Button
          variant="subtle"
          justify="flex-start"
          leftSection={<span aria-hidden="true">○</span>}
          aria-pressed={status === 'migraine_free'}
          disabled={saving || disabled}
          onClick={() => void save('migraine_free')}
        >
          Migraine-free
        </Button>
        {canClear && (
          <Button
            variant="subtle"
            justify="flex-start"
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
            disabled={saving || disabled}
            onClick={() => void save('')}
          >
            Clear day
          </Button>
        )}
      </Stack>
      <ErrorMessages messages={errors} />
      {errors.length > 0 && (
        <Button
          size="md"
          disabled={saving || disabled}
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
