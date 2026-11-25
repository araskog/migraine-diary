import { useEffect, useRef, useState } from 'react'
import { Box, Button, Stack } from '@mantine/core'
import LoadingIndicator from './LoadingIndicator'
import DiaryDetailsFields from './DiaryDetailsFields'
import ErrorMessages from './ErrorMessages'
import { apiDetailsFrom, localDate, saveEntry } from './diary'
import type { DiaryDetails, DiaryEntry } from './diary'
import {
  phaseAFromDetails,
  readPhaseAStorage,
  writePhaseAStorage,
} from './phaseAPrototypeStorage'
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
  const phaseA = readPhaseAStorage(entry.date)
  return {
    medication_taken,
    medication_name,
    sleep,
    sleep_duration,
    pain_severity,
    ...phaseA,
  }
}

function persistPhaseA(date: string, details: DiaryDetails): void {
  writePhaseAStorage(date, phaseAFromDetails(details))
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
  const latest = useRef(details)
  const pending = useRef<DiaryDetails | null>(null)
  const savingRef = useRef(false)
  const [errors, setErrors] = useState<string[]>([])
  const dirty =
    saving ||
    errors.length > 0 ||
    JSON.stringify(details) !== JSON.stringify(savedDetails)

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

  async function save(value = latest.current) {
    if (disabled) return
    pending.current = value
    if (savingRef.current) return
    if (date > localDate()) {
      setErrors(['Choose today or a past date.'])
      return
    }
    savingRef.current = true
    setSaving(true)
    onSavingChange(true)
    setErrors([])
    try {
      while (pending.current) {
        const submitted = pending.current
        pending.current = null
        persistPhaseA(date, submitted)
        const saved = await saveEntry(date, status, csrfToken, submitted)
        const confirmed = detailsOf(saved)
        setSavedDetails(confirmed)
        if (latest.current === submitted) {
          latest.current = confirmed
          setDetails(confirmed)
        }
        onSaved(saved)
      }
    } catch {
      setErrors([
        'Unable to save your changes. Your answers are kept; please try again.',
      ])
      try {
        const session = await getSession()
        if (session.user === null) onSignedOut(session)
        else onSessionRefreshed(session)
      } catch {
        // Keep answers available for retry when the connection returns.
      }
    } finally {
      pending.current = null
      savingRef.current = false
      setSaving(false)
      onSavingChange(false)
    }
  }

  function applyChange(value: DiaryDetails, commit = true) {
    latest.current = value
    setDetails(value)
    persistPhaseA(date, value)
    const apiChanged =
      JSON.stringify(apiDetailsFrom(value)) !==
      JSON.stringify(apiDetailsFrom(savedDetails))
    if (commit && apiChanged) void save(value)
    else if (commit && !apiChanged) {
      setSavedDetails(value)
    }
  }

  return (
    <Stack gap="sm">
      <DiaryDetailsFields
        status={status}
        value={details}
        disabled={disabled}
        onChange={applyChange}
      />
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
      <Box mih="1.5em">
        {saving && <LoadingIndicator label="Saving details" />}
      </Box>
    </Stack>
  )
}
