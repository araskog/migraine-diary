import { useState } from 'react'
import { Button, Stack } from '@mantine/core'
import ErrorMessages from './ErrorMessages'
import { localDate, saveEntry } from './diary'
import type { DiaryEntry, DiaryStatus } from './diary'
import { getSession } from './session'
import type { Session } from './session'

type DiaryEntryFormProps = {
  date: string
  entry?: DiaryEntry
  csrfToken: string
  disabled: boolean
  onSaved: (entry: DiaryEntry) => void
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
  onSavingChange,
  onSignedOut,
  onSessionRefreshed,
}: DiaryEntryFormProps) {
  const [status, setStatus] = useState<DiaryStatus | ''>(entry?.status ?? '')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  async function save(nextStatus: DiaryStatus) {
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
      const saved = await saveEntry(date, nextStatus, csrfToken)
      onSaved(saved)
    } catch {
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
      setSaving(false)
      onSavingChange(false)
    }
  }

  return (
    <Stack gap="md">
      <Stack gap="sm">
        <Button
          variant={status === 'migraine' ? 'filled' : 'default'}
          disabled={saving || disabled}
          onClick={() => void save('migraine')}
        >
          Migraine
        </Button>
        <Button
          variant={status === 'migraine_free' ? 'filled' : 'default'}
          disabled={saving || disabled}
          onClick={() => void save('migraine_free')}
        >
          Migraine-free
        </Button>
      </Stack>
      <ErrorMessages messages={errors} />
      {errors.length > 0 && status && (
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
