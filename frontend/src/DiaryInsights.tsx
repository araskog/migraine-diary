import { useEffect, useState } from 'react'
import {
  Accordion,
  Alert,
  Badge,
  Group,
  Paper,
  Progress,
  RingProgress,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import LoadingIndicator from './LoadingIndicator'
import ErrorMessages from './ErrorMessages'
import {
  formatRate,
  formatShareLabel,
  loadInsights,
  type DiaryInsights,
  type InsightsPainSlice,
  type InsightsSlice,
  type InsightsWeekdaySlice,
} from './insights'
import './DiaryInsights.css'

type DiaryInsightsProps = {
  active: boolean
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <Paper withBorder radius="md" p="md" className="diary-insights-stat">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text size="xl" fw={700} mt={4}>
        {value}
      </Text>
      {hint && (
        <Text size="xs" c="dimmed" mt={4}>
          {hint}
        </Text>
      )}
    </Paper>
  )
}

function RateCell({
  rate,
  sufficient,
}: {
  rate: number | null
  sufficient: boolean
}) {
  return (
    <Group gap="xs" wrap="nowrap">
      <Text size="sm">{formatRate(rate)}</Text>
      {!sufficient && (
        <Badge size="xs" variant="light" color="gray">
          Few answers
        </Badge>
      )}
    </Group>
  )
}

function SliceTable({
  caption,
  rows,
  valueLabel,
  calendarDays,
}: {
  caption: string
  rows: InsightsSlice[]
  valueLabel: string
  calendarDays: number
}) {
  const visible = rows.filter((row) => row.recorded_days > 0)
  if (visible.length === 0) return null
  const shareLabel = formatShareLabel(calendarDays)
  return (
    <Table
      captionSide="top"
      withTableBorder
      striped
      highlightOnHover
      className="diary-insights-table"
    >
      <Table.Caption className="visually-hidden">{caption}</Table.Caption>
      <Table.Thead>
        <Table.Tr>
          <Table.Th scope="col">{valueLabel}</Table.Th>
          <Table.Th scope="col">Answers</Table.Th>
          <Table.Th scope="col">Migraine days</Table.Th>
          <Table.Th scope="col">{shareLabel}</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {visible.map((row) => (
          <Table.Tr key={String(row.value)}>
            <Table.Td>{row.label}</Table.Td>
            <Table.Td>{row.recorded_days}</Table.Td>
            <Table.Td>{row.migraine_days}</Table.Td>
            <Table.Td>
              <RateCell
                rate={row.migraine_rate}
                sufficient={row.sufficient_data}
              />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}

function WeekdayTable({
  rows,
  calendarDays,
}: {
  rows: InsightsWeekdaySlice[]
  calendarDays: number
}) {
  const visible = rows.filter((row) => row.calendar_days > 0)
  if (visible.length === 0) return null
  const shareLabel = formatShareLabel(calendarDays)
  return (
    <Table
      captionSide="top"
      withTableBorder
      striped
      highlightOnHover
      className="diary-insights-table"
    >
      <Table.Caption className="visually-hidden">
        Migraine share by weekday
      </Table.Caption>
      <Table.Thead>
        <Table.Tr>
          <Table.Th scope="col">Weekday</Table.Th>
          <Table.Th scope="col">Days in period</Table.Th>
          <Table.Th scope="col">Recorded</Table.Th>
          <Table.Th scope="col">Migraine days</Table.Th>
          <Table.Th scope="col">{shareLabel}</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {visible.map((row) => (
          <Table.Tr key={row.weekday}>
            <Table.Td>{row.label}</Table.Td>
            <Table.Td>{row.calendar_days}</Table.Td>
            <Table.Td>{row.recorded_days}</Table.Td>
            <Table.Td>{row.migraine_days}</Table.Td>
            <Table.Td>
              <RateCell
                rate={row.migraine_rate}
                sufficient={row.sufficient_data}
              />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}

function PainTable({
  caption,
  rows,
}: {
  caption: string
  rows: InsightsPainSlice[]
}) {
  const visible = rows.filter((row) => row.migraine_days > 0)
  if (visible.length === 0) return null
  return (
    <Table
      captionSide="top"
      withTableBorder
      striped
      highlightOnHover
      className="diary-insights-table"
    >
      <Table.Caption className="visually-hidden">{caption}</Table.Caption>
      <Table.Thead>
        <Table.Tr>
          <Table.Th scope="col">Group</Table.Th>
          <Table.Th scope="col">Migraine days</Table.Th>
          <Table.Th scope="col">Average pain</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {visible.map((row) => (
          <Table.Tr
            key={`${row.label}-${String(row.value)}-${String(row.medication_taken)}`}
          >
            <Table.Td>{row.label}</Table.Td>
            <Table.Td>{row.migraine_days}</Table.Td>
            <Table.Td>
              {row.average_pain_severity !== null ? (
                <Group gap="xs" wrap="nowrap">
                  <Text size="sm">{row.average_pain_severity} / 10</Text>
                  {!row.sufficient_data && (
                    <Badge size="xs" variant="light" color="gray">
                      Few answers
                    </Badge>
                  )}
                </Group>
              ) : (
                '—'
              )}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}

function InsightsContent({ insights }: { insights: DiaryInsights }) {
  const { summary, coverage, window_days } = insights
  const ratePercent = Math.round((summary.migraine_rate ?? 0) * 100)

  return (
    <Stack gap="lg" className="diary-insights">
      <Paper
        withBorder
        radius="md"
        p="md"
        className="diary-insights-narrative-slot"
        aria-hidden="true"
      />

      <Alert variant="light" color="gray" title="How these numbers work">
        Shares use all {summary.calendar_days} calendar days in the window.
        Unrecorded days count as non-migraine in the share only; the calendar
        still shows them as missing, not migraine-free. Not medical advice.
      </Alert>

      {summary.insufficient_data ? (
        <Alert color="gray" title="More diary days needed">
          Record at least {summary.minimum_recorded_days} days in this window to
          see detailed breakdowns. You have {summary.recorded_days} recorded
          days so far.
        </Alert>
      ) : null}

      <Paper withBorder radius="md" p="lg" className="diary-insights-hero">
        <Group align="center" gap="xl" wrap="wrap">
          <RingProgress
            size={120}
            thickness={12}
            roundCaps
            sections={[{ value: ratePercent, color: 'var(--app-migraine)' }]}
            label={
              <Text ta="center" size="lg" fw={700}>
                {formatRate(summary.migraine_rate)}
              </Text>
            }
            aria-label={`Migraine share ${formatRate(summary.migraine_rate)}`}
          />
          <Stack gap="xs" flex={1} mih={0}>
            <Text size="sm" fw={600}>
              Migraine share in the last {window_days} days
            </Text>
            <Text size="sm" c="dimmed">
              {summary.migraine_days} migraine days out of{' '}
              {summary.calendar_days} calendar days (through {insights.today}).
            </Text>
            <Progress
              value={ratePercent}
              color="var(--app-migraine)"
              size="sm"
              aria-hidden
            />
          </Stack>
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        <StatCard label="Recorded" value={summary.recorded_days} />
        <StatCard label="Unrecorded" value={summary.unrecorded_days} />
        <StatCard
          label="Migraine-free"
          value={summary.migraine_free_days}
          hint="Explicitly recorded"
        />
        <StatCard label="Migraine" value={summary.migraine_days} />
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Group gap="xs" mb="sm">
          <ThemeIcon size="sm" variant="light" color="sage" radius="xl">
            <Text size="xs" fw={700}>
              i
            </Text>
          </ThemeIcon>
          <Text size="sm" fw={600}>
            Detail coverage
          </Text>
        </Group>
        <Text size="sm" c="dimmed">
          Sleep duration {coverage.sleep_duration_answered} · Sleep quality{' '}
          {coverage.sleep_quality_answered} · Medication{' '}
          {coverage.medication_answered} · Pain on migraine days{' '}
          {coverage.pain_answered}
        </Text>
      </Paper>

      <Accordion
        variant="separated"
        radius="md"
        className="diary-insights-accordion"
      >
        <Accordion.Item value="weekday">
          <Accordion.Control>By weekday</Accordion.Control>
          <Accordion.Panel>
            <WeekdayTable
              rows={insights.weekdays}
              calendarDays={summary.calendar_days}
            />
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="sleep-duration">
          <Accordion.Control>
            Migraine share and sleep duration
          </Accordion.Control>
          <Accordion.Panel>
            <SliceTable
              caption="Migraine share by sleep duration"
              valueLabel="Sleep duration"
              calendarDays={summary.calendar_days}
              rows={insights.sleep_duration}
            />
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="sleep-quality">
          <Accordion.Control>
            Migraine share and sleep quality
          </Accordion.Control>
          <Accordion.Panel>
            <SliceTable
              caption="Migraine share by sleep quality"
              valueLabel="Sleep quality"
              calendarDays={summary.calendar_days}
              rows={insights.sleep_quality}
            />
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="medication">
          <Accordion.Control>Migraine share and medication</Accordion.Control>
          <Accordion.Panel>
            <SliceTable
              caption="Migraine share when medication was recorded"
              valueLabel="Medication"
              calendarDays={summary.calendar_days}
              rows={insights.medication}
            />
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="pain">
          <Accordion.Control>Average pain</Accordion.Control>
          <Accordion.Panel>
            <Stack gap="lg">
              <PainTable
                caption="Average pain by sleep duration"
                rows={insights.pain_by_sleep_duration}
              />
              <PainTable
                caption="Average pain by sleep quality"
                rows={insights.pain_by_sleep_quality}
              />
              <PainTable
                caption="Average pain and medication"
                rows={insights.pain_by_medication}
              />
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  )
}

export default function DiaryInsights({ active }: DiaryInsightsProps) {
  const [insights, setInsights] = useState<DiaryInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (!active) return undefined
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setErrors([])
      try {
        const next = await loadInsights(controller.signal)
        setInsights(next)
      } catch {
        if (!controller.signal.aborted) {
          setErrors(['Unable to load pattern insights. Please try again.'])
          setInsights(null)
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [active])

  return (
    <Stack gap="md" className="diary-insights-page">
      <Title order={2} size="h3">
        Pattern insights
      </Title>
      {loading && <LoadingIndicator label="Loading pattern insights" />}
      <ErrorMessages messages={errors} />
      {!loading && insights && <InsightsContent insights={insights} />}
    </Stack>
  )
}
