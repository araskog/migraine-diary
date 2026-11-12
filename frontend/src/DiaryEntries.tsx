import { useEffect, useState } from 'react'
import { Box, Button, Group, Popover, Stack, Text } from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import DiaryEntryForm from './DiaryEntryForm'
import ErrorMessages from './ErrorMessages'
import { dateLabel, loadEntries, localDate, statusLabel } from './diary'
import type { DiaryEntry, DiaryStatus } from './diary'
import type { Session } from './session'
import './DiaryEntries.css'

const statusIcons: Record<DiaryStatus, string> = {
  migraine: '●',
  migraine_free: '○',
}

type DiaryEntriesProps = {
  csrfToken: string
  disabled: boolean
  onSavingChange: (saving: boolean) => void
  onSignedOut: (session: Session) => void
  onSessionRefreshed: (session: Session) => void
}

export default function DiaryEntries({
  csrfToken,
  disabled,
  onSavingChange,
  onSignedOut,
  onSessionRefreshed,
}: DiaryEntriesProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [date, setDate] = useState(localDate)
  const [selectionOpened, setSelectionOpened] = useState(false)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const today = localDate()
  const current = entries.find((entry) => entry.date === date)
  const statuses = new Map(entries.map((entry) => [entry.date, entry.status]))

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const saved = await loadEntries(controller.signal)
        if (!controller.signal.aborted) setEntries(saved)
      } catch {
        if (!controller.signal.aborted) setFailed(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [attempt])

  if (loading) return <Text role="status">Loading your diary…</Text>
  if (failed)
    return (
      <Stack gap="md">
        <ErrorMessages
          messages={['Unable to load your diary. Please try again.']}
        />
        <Button
          variant="light"
          disabled={disabled}
          onClick={() => {
            setFailed(false)
            setLoading(true)
            setAttempt((value) => value + 1)
          }}
        >
          Try again
        </Button>
      </Stack>
    )

  return (
    <Stack gap="xl" className="diary-entries">
      <Box>
        <DatePicker
          aria-label="Diary calendar"
          value={date}
          onChange={(value) => {
            if (value && value <= localDate()) {
              setDate(value)
              setSelectionOpened(true)
            }
          }}
          firstDayOfWeek={1}
          fullWidth
          maxLevel="month"
          previousLabel="Previous month"
          nextLabel="Next month"
          maxDate={today}
          size="lg"
          withCellSpacing={false}
          weekendDays={[]}
          getDayProps={(day) => ({
            disabled: disabled || day > today,
            'aria-label': `${dateLabel(day)}, ${day > today ? 'Future date' : statusLabel(statuses.get(day))}`,
          })}
          renderDay={(day) => {
            const status = statuses.get(day)
            const content = (
              <span className="calendar-day">
                <span>{Number(day.slice(-2))}</span>
                <span
                  className={`calendar-marker ${day > today ? 'future' : (status ?? 'unrecorded')}`}
                  aria-hidden="true"
                >
                  {status ? statusIcons[status] : null}
                </span>
              </span>
            )
            if (day !== date) return content
            return (
              <Popover
                opened={selectionOpened}
                onChange={(opened) => {
                  if (!disabled) setSelectionOpened(opened)
                }}
                position="bottom"
                width={190}
                shadow="sm"
                trapFocus
                returnFocus
              >
                <Popover.Target>{content}</Popover.Target>
                <Popover.Dropdown
                  p="xs"
                  aria-label={`Status for ${dateLabel(date)}`}
                >
                  <DiaryEntryForm
                    key={date}
                    date={date}
                    entry={current}
                    csrfToken={csrfToken}
                    disabled={disabled}
                    onSaved={(saved) => {
                      setSelectionOpened(false)
                      setEntries((previous) => [
                        ...previous.filter(
                          (entry) => entry.date !== saved.date,
                        ),
                        saved,
                      ])
                    }}
                    onSavingChange={onSavingChange}
                    onSignedOut={onSignedOut}
                    onSessionRefreshed={onSessionRefreshed}
                  />
                </Popover.Dropdown>
              </Popover>
            )
          }}
        />
        <Group gap="md" mt="md" wrap="wrap">
          <Text size="xs">
            <span className="migraine" aria-hidden="true">
              ●{' '}
            </span>
            Migraine
          </Text>
          <Text size="xs">
            <span className="migraine_free" aria-hidden="true">
              ○{' '}
            </span>
            Migraine-free
          </Text>
        </Group>
      </Box>
    </Stack>
  )
}
