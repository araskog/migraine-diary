import { useEffect, useState } from 'react'
import { Button, Group, Stack, Text } from '@mantine/core'
import DiaryDetailsFields from './DiaryDetailsFields'
import ErrorMessages from './ErrorMessages'
import { localDate, saveEntry } from './diary'
import type { DiaryDetails, DiaryEntry } from './diary'
import { getSession } from './session'
import type { Session } from './session'

type DiaryEntryFormProps = {
  date: string
  entry: DiaryEntry
  csrfToken: string
  disabled: boolean
  onSaved: (entry: DiaryEntry) => void
  onDirtyChange: (dirty: boolean) => void
  onSavingChange: (saving: boolean) => void
  onSignedOut: (session: Session) => void
  onSessionRefreshed: (session: Session) => void
}

function detailsOf(entry: DiaryEntry): DiaryDetails {
  const {
    medication_taken,
    medication_name,
    sleep,
    sleep_duration,
    pain_severity,
  } = entry
  return {
    medication_taken,
    medication_name,
    sleep,
    sleep_duration,
    pain_severity,
  }
}

export default function DiaryEntryForm({
  date,
  entry,
  csrfToken,
  disabled,
  onSaved,
  onDirtyChange,
  onSavingChange,
  onSignedOut,
  onSessionRefreshed,
}: DiaryEntryFormProps) {
  const status = entry.status
  const [details, setDetails] = useState(() => detailsOf(entry))
  const [savedDetails, setSavedDetails] = useState(() => detailsOf(entry))
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const dirty = JSON.stringify(details) !== JSON.stringify(savedDetails)

  useEffect(() => {
    onDirtyChange(dirty)
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault()
    }
    if (dirty) window.addEventListener('beforeunload', warn)
    return () => {
      window.removeEventListener('beforeunload', warn)
      onDirtyChange(false)
    }
  }, [dirty, onDirtyChange])

  async function save() {
    if (saving || disabled || !status) return
    setErrors([])
    setNotice('')
    if (date > localDate()) {
      setErrors(['Choose today or a past date.'])
      return
    }
    setSaving(true)
    onSavingChange(true)
    try {
      const saved = await saveEntry(date, status, csrfToken, details)
      setDetails(detailsOf(saved))
      setSavedDetails(detailsOf(saved))
      setNotice('Details saved')
      onSaved(saved)
    } catch {
      setErrors([
        'Unable to confirm this save. Your answers are kept; please try again.',
      ])
      try {
        const session = await getSession()
        if (session.user === null) onSignedOut(session)
        else onSessionRefreshed(session)
      } catch {
        // Keep answers available for retry when the connection returns.
      }
    } finally {
      setSaving(false)
      onSavingChange(false)
    }
  }

  return (
    <Stack gap="sm">
      <Stack
        component="form"
        gap="md"
        onSubmit={(event) => {
          event.preventDefault()
          void save()
        }}
      >
        <DiaryDetailsFields
          status={status}
          value={details}
          disabled={saving || disabled}
          onChange={(value) => {
            setDetails(value)
            setNotice('')
          }}
        />
        <Group>
          <Button
            type="submit"
            disabled={!dirty || saving || disabled}
            loading={saving}
          >
            Save details
          </Button>
          {dirty && (
            <Button
              variant="subtle"
              disabled={saving || disabled}
              onClick={() => {
                setDetails(savedDetails)
                setNotice('')
                setErrors([])
              }}
            >
              Discard changes
            </Button>
          )}
        </Group>
      </Stack>
      <ErrorMessages messages={errors} />
      {errors.length > 0 && status && (
        <Button
          variant="light"
          disabled={saving || disabled}
          onClick={() => void save()}
        >
          Try again
        </Button>
      )}
      <Text role="status" size="sm" c="dimmed" mih="1.5em">
        {notice || (dirty ? 'Unsaved details' : '')}
      </Text>
    </Stack>
  )
}
