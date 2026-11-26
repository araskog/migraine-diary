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
  Title,
} from '@mantine/core'
import LoadingIndicator from './LoadingIndicator'
import ErrorMessages from './ErrorMessages'
import {
  formatRate,
  loadInsights,
  periodPercentLabel,
  type DiaryInsights,
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

function PeriodPercentCell({
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
  const percentLabel = periodPercentLabel(calendarDays)
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
          <Table.Th scope="col">Days you logged this</Table.Th>
          <Table.Th scope="col">Migraine days</Table.Th>
          <Table.Th scope="col">{percentLabel}</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {visible.map((row) => (
          <Table.Tr key={String(row.value)}>
            <Table.Td>{row.label}</Table.Td>
            <Table.Td>{row.recorded_days}</Table.Td>
            <Table.Td>{row.migraine_days}</Table.Td>
            <Table.Td>
              <PeriodPercentCell
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
  const percentLabel = periodPercentLabel(calendarDays)
  return (
    <Table
      captionSide="top"
      withTableBorder
      striped
      highlightOnHover
      className="diary-insights-table"
    >
      <Table.Caption className="visually-hidden">
        Migraine days by weekday
      </Table.Caption>
      <Table.Thead>
        <Table.Tr>
          <Table.Th scope="col">Weekday</Table.Th>
          <Table.Th scope="col">Days in period</Table.Th>
          <Table.Th scope="col">Recorded</Table.Th>
          <Table.Th scope="col">Migraine days</Table.Th>
          <Table.Th scope="col">{percentLabel}</Table.Th>
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
              <PeriodPercentCell
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

function formatAveragePain(
  average: number | null,
  answeredDays: number,
): string {
  if (average === null || answeredDays === 0) return '—'
  return `${average} / 10`
}

function InsightsContent({ insights }: { insights: DiaryInsights }) {
  const { summary, window_days } = insights
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
              <Text ta="center" size="xl" fw={700}>
                {summary.migraine_days}
              </Text>
            }
            aria-label={`${summary.migraine_days} migraine days in the last ${window_days} days`}
          />
          <Stack gap="xs" flex={1} mih={0}>
            <Text size="sm" fw={600}>
              Migraine days in the last {window_days} days
            </Text>
            <Text size="sm" c="dimmed">
              {summary.migraine_days} of {summary.calendar_days} days (
              {formatRate(summary.migraine_rate)} of the period, through{' '}
              {insights.today}).
            </Text>
            <Text size="sm" c="dimmed">
              Unrecorded days count as non-migraine.
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

      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
        <StatCard label="Recorded" value={summary.recorded_days} />
        <StatCard label="Unrecorded" value={summary.unrecorded_days} />
        <StatCard
          label="Migraine-free"
          value={summary.migraine_free_days}
          hint="Explicitly recorded"
        />
        <StatCard label="Migraine" value={summary.migraine_days} />
        <StatCard
          label="Average pain"
          value={formatAveragePain(
            summary.average_pain_severity,
            summary.pain_answered_migraine_days,
          )}
          hint={
            summary.pain_answered_migraine_days > 0
              ? `On ${summary.pain_answered_migraine_days} migraine days with pain logged`
              : 'Log pain on migraine days to see this'
          }
        />
      </SimpleGrid>

      {!summary.insufficient_data ? (
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
            <Accordion.Control>Migraine days by sleep duration</Accordion.Control>
            <Accordion.Panel>
              <SliceTable
                caption="Migraine days when sleep duration was logged"
                valueLabel="Sleep duration"
                calendarDays={summary.calendar_days}
                rows={insights.sleep_duration}
              />
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="sleep-quality">
            <Accordion.Control>Migraine days by sleep quality</Accordion.Control>
            <Accordion.Panel>
              <SliceTable
                caption="Migraine days when sleep quality was logged"
                valueLabel="Sleep quality"
                calendarDays={summary.calendar_days}
                rows={insights.sleep_quality}
              />
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="medication">
            <Accordion.Control>Migraine days by medication</Accordion.Control>
            <Accordion.Panel>
              <SliceTable
                caption="Migraine days when medication was logged"
                valueLabel="Medication"
                calendarDays={summary.calendar_days}
                rows={insights.medication}
              />
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      ) : null}
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
