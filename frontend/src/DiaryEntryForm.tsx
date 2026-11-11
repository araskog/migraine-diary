import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Radio, Stack, Text, Title } from '@mantine/core'
import ErrorMessages from './ErrorMessages'
import { dateLabel, localDate, saveEntry, statusLabel } from './diary'
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
  const [notice, setNotice] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
      const saved = await saveEntry(date, status, csrfToken)
      onSaved(saved)
      setNotice(`Saved: ${statusLabel(saved.status)}.`)
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
    <form
      onSubmit={(event) => {
        void submit(event)
      }}
    >
      <Stack gap="md">
        <Title order={2} size="h4">
          {dateLabel(date)}
        </Title>
        <Text size="sm" c="dimmed">
          {entry
            ? `Recorded: ${statusLabel(entry.status)}. You can update this day.`
            : 'This day is unrecorded.'}
        </Text>
        <Radio.Group
          name="diary-status"
          label="How was this day?"
          value={status}
          onChange={(value) => {
            if (value !== 'migraine' && value !== 'migraine_free') return
            setStatus(value)
            setErrors([])
            setNotice('')
          }}
        >
          <Stack gap="sm" mt="sm">
            <Radio
              value="migraine"
              label="Migraine"
              disabled={saving || disabled}
            />
            <Radio
              value="migraine_free"
              label="Migraine-free"
              disabled={saving || disabled}
            />
          </Stack>
        </Radio.Group>
        <ErrorMessages messages={errors} />
        <Button
          type="submit"
          size="md"
          disabled={saving || disabled || !status}
        >
          {saving ? 'Saving…' : entry ? 'Update day' : 'Save day'}
        </Button>
        {notice && (
          <Text role="status" size="sm">
            {notice}
          </Text>
        )}
      </Stack>
    </form>
  )
}
