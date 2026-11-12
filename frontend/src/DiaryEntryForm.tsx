import { useEffect, useState } from 'react'
import { Box, Button, Group, Stack, Text } from '@mantine/core'
import DiaryDetailsFields from './DiaryDetailsFields'
import ConfirmDialog from './ConfirmDialog'
import ErrorMessages from './ErrorMessages'
import { emptyDetails, localDate, saveEntry } from './diary'
import type { DiaryDetails, DiaryEntry, DiaryStatus } from './diary'
import { getSession } from './session'
import type { Session } from './session'

type DiaryEntryFormProps = {
  date: string
  entry?: DiaryEntry
  csrfToken: string
  disabled: boolean
  onSaved: (entry: DiaryEntry) => void
  onDirtyChange: (dirty: boolean) => void
  onSavingChange: (saving: boolean) => void
  onSignedOut: (session: Session) => void
  onSessionRefreshed: (session: Session) => void
}

function detailsOf(entry?: DiaryEntry): DiaryDetails {
  if (!entry) return emptyDetails()
  const { medication_taken, medication_name, sleep, pain_severity } = entry
  return { medication_taken, medication_name, sleep, pain_severity }
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
  const [status, setStatus] = useState<DiaryStatus | ''>(entry?.status ?? '')
  const [details, setDetails] = useState(() => detailsOf(entry))
  const [savedDetails, setSavedDetails] = useState(() => detailsOf(entry))
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [retryDetails, setRetryDetails] = useState(false)
  const [confirmFree, setConfirmFree] = useState(false)
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

  async function save(nextStatus: DiaryStatus, includeDetails = false) {
    if (saving || disabled) return
    setStatus(nextStatus)
    setErrors([])
    setNotice('')
    setRetryDetails(includeDetails)
    if (date > localDate()) {
      setErrors(['Choose today or a past date.'])
      return
    }
    setSaving(true)
    onSavingChange(true)
    try {
      const nextDetails =
        nextStatus === 'migraine_free'
          ? { ...details, pain_severity: null }
          : details
      const saved = await saveEntry(
        date,
        nextStatus,
        csrfToken,
        includeDetails ? nextDetails : undefined,
      )
      if (includeDetails) {
        setDetails(detailsOf(saved))
        setSavedDetails(detailsOf(saved))
      } else if (nextStatus === 'migraine_free') {
        setDetails(nextDetails)
        setSavedDetails((previous) => ({ ...previous, pain_severity: null }))
      }
      setNotice(includeDetails ? 'Details saved' : 'Day saved')
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
    <Stack gap="xl">
      <ConfirmDialog
        opened={confirmFree}
        title="Change to migraine-free?"
        message="This will remove the pain rating for this day. Your other answers will stay."
        confirmLabel="Change to migraine-free"
        onClose={() => setConfirmFree(false)}
        onConfirm={() => {
          setConfirmFree(false)
          void save('migraine_free')
        }}
      />
      <Box className="diary-status">
        <Button
          variant={status === 'migraine' ? 'light' : 'subtle'}
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
          variant={status === 'migraine_free' ? 'light' : 'subtle'}
          leftSection={<span aria-hidden="true">○</span>}
          aria-pressed={status === 'migraine_free'}
          disabled={saving || disabled}
          onClick={() => {
            if (details.pain_severity !== null) setConfirmFree(true)
            else void save('migraine_free')
          }}
        >
          Migraine-free
        </Button>
      </Box>
      {status ? (
        <Stack
          component="form"
          gap="xl"
          onSubmit={(event) => {
            event.preventDefault()
            void save(status, true)
          }}
        >
          <Text size="sm" c="dimmed">
            A little more about your day, if you like. Everything below is
            optional.
          </Text>
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
              loading={saving && retryDetails}
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
      ) : (
        <Text size="sm" c="dimmed">
          Choose Migraine or Migraine-free to record this day. Details are
          optional.
        </Text>
      )}
      <ErrorMessages messages={errors} />
      {errors.length > 0 && status && (
        <Button
          variant="light"
          disabled={saving || disabled}
          onClick={() => void save(status, retryDetails)}
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
