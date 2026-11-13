import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Group,
  Paper,
  Popover,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import DiaryEntryForm from './DiaryEntryForm'
import DiaryStatusPicker from './DiaryStatusPicker'
import ConfirmDialog from './ConfirmDialog'
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
  saving: boolean
  dirty: boolean
  onDirtyChange: (dirty: boolean) => void
  onSavingChange: (saving: boolean) => void
  onStatusSavingChange: (saving: boolean) => void
  onSignedOut: (session: Session) => void
  onSessionRefreshed: (session: Session) => void
}

export default function DiaryEntries({
  csrfToken,
  disabled,
  saving,
  dirty,
  onDirtyChange,
  onSavingChange,
  onStatusSavingChange,
  onSignedOut,
  onSessionRefreshed,
}: DiaryEntriesProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [date, setDate] = useState(localDate)
  const [selectionOpened, setSelectionOpened] = useState(false)
  const [revision, setRevision] = useState(0)
  const [pendingDate, setPendingDate] = useState<string | null>(null)
  const [visibleMonth, setVisibleMonth] = useState(localDate)
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
    <Box className="diary-entries">
      <ConfirmDialog
        opened={pendingDate !== null}
        title="Unsaved details"
        message="Discard your unfinished details and choose another day?"
        confirmLabel="Discard and continue"
        onClose={() => setPendingDate(null)}
        onConfirm={() => {
          if (pendingDate) setDate(pendingDate)
          setRevision((value) => value + 1)
          setSelectionOpened(true)
          setPendingDate(null)
        }}
      />
      <Box>
        <DatePicker
          aria-label="Diary calendar"
          value={date}
          date={visibleMonth}
          onDateChange={(month) => {
            if (!disabled && !saving) {
              setVisibleMonth(month)
              setSelectionOpened(false)
            }
          }}
          onChange={(value) => {
            if (!disabled && !saving && value && value <= localDate()) {
              if (dirty) {
                setPendingDate(value)
                return
              }
              setDate(value)
              setSelectionOpened(true)
            }
          }}
          firstDayOfWeek={1}
          fullWidth
          maxLevel="year"
          onLevelChange={() => setSelectionOpened(false)}
          ariaLabels={{
            monthLevelControl: 'Choose month',
            previousMonth: 'Previous month',
            nextMonth: 'Next month',
            previousYear: 'Previous year',
            nextYear: 'Next year',
          }}
          maxDate={today}
          size="lg"
          withCellSpacing={false}
          weekendDays={[]}
          getDayProps={(day) => ({
            disabled: day > today,
            'aria-disabled': disabled || saving || day > today,
            className:
              (disabled || saving) && day <= today
                ? 'calendar-day-busy'
                : undefined,
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
                  <DiaryStatusPicker
                    key={date}
                    date={date}
                    entry={current}
                    csrfToken={csrfToken}
                    disabled={disabled || saving}
                    onCleared={() => {
                      setSelectionOpened(false)
                      setEntries((previous) =>
                        previous.filter((entry) => entry.date !== date),
                      )
                    }}
                    onSaved={(saved) => {
                      setSelectionOpened(false)
                      setEntries((previous) => [
                        ...previous.filter(
                          (entry) => entry.date !== saved.date,
                        ),
                        saved,
                      ])
                    }}
                    onSavingChange={onStatusSavingChange}
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
      {current?.status === 'migraine' && (
        <Paper
          component="section"
          bg="var(--app-intro-background)"
          withBorder
          p="lg"
          radius="lg"
          aria-label={`Details for ${dateLabel(date)}`}
        >
          <Stack gap="xs">
            <Title order={2} size="h3">
              Daily details
            </Title>
            <Text c="dimmed" size="sm">
              {dateLabel(date)}
            </Text>
            <DiaryEntryForm
              key={`${date}-${current?.status ?? ''}-${revision}`}
              date={date}
              entry={current}
              csrfToken={csrfToken}
              disabled={disabled}
              onSaved={(saved) =>
                setEntries((previous) => [
                  ...previous.filter((entry) => entry.date !== saved.date),
                  saved,
                ])
              }
              onDirtyChange={onDirtyChange}
              onSavingChange={onSavingChange}
              onSignedOut={onSignedOut}
              onSessionRefreshed={onSessionRefreshed}
            />
          </Stack>
        </Paper>
      )}
    </Box>
  )
}
