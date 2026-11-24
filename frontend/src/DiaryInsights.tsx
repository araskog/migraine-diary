import { useEffect, useState } from 'react'
import { Alert, Group, Stack, Table, Text, Title } from '@mantine/core'
import LoadingIndicator from './LoadingIndicator'
import ErrorMessages from './ErrorMessages'
import {
  formatRate,
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

function SliceTable({
  caption,
  rows,
  valueLabel,
}: {
  caption: string
  rows: InsightsSlice[]
  valueLabel: string
}) {
  const visible = rows.filter((row) => row.recorded_days > 0)
  if (visible.length === 0) return null
  return (
    <Stack gap="xs">
      <Text component="h3" size="sm" fw={600}>
        {caption}
      </Text>
      <Table
        captionSide="top"
        withTableBorder
        withColumnBorders
        className="diary-insights-table"
      >
        <Table.Caption className="visually-hidden">{caption}</Table.Caption>
        <Table.Thead>
          <Table.Tr>
            <Table.Th scope="col">{valueLabel}</Table.Th>
            <Table.Th scope="col">Recorded days</Table.Th>
            <Table.Th scope="col">Migraine days</Table.Th>
            <Table.Th scope="col">Migraine rate</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {visible.map((row) => (
            <Table.Tr key={String(row.value)}>
              <Table.Td>{row.label}</Table.Td>
              <Table.Td>{row.recorded_days}</Table.Td>
              <Table.Td>{row.migraine_days}</Table.Td>
              <Table.Td>
                {row.sufficient_data
                  ? formatRate(row.migraine_rate)
                  : `${formatRate(row.migraine_rate)} (few days)`}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}

function WeekdayTable({ rows }: { rows: InsightsWeekdaySlice[] }) {
  const visible = rows.filter((row) => row.recorded_days > 0)
  if (visible.length === 0) return null
  return (
    <Stack gap="xs">
      <Text component="h3" size="sm" fw={600}>
        By weekday
      </Text>
      <Table
        captionSide="top"
        withTableBorder
        withColumnBorders
        className="diary-insights-table"
      >
        <Table.Caption className="visually-hidden">
          Migraine rate by weekday
        </Table.Caption>
        <Table.Thead>
          <Table.Tr>
            <Table.Th scope="col">Weekday</Table.Th>
            <Table.Th scope="col">Recorded days</Table.Th>
            <Table.Th scope="col">Migraine days</Table.Th>
            <Table.Th scope="col">Migraine rate</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {visible.map((row) => (
            <Table.Tr key={row.weekday}>
              <Table.Td>{row.label}</Table.Td>
              <Table.Td>{row.recorded_days}</Table.Td>
              <Table.Td>{row.migraine_days}</Table.Td>
              <Table.Td>
                {row.sufficient_data
                  ? formatRate(row.migraine_rate)
                  : `${formatRate(row.migraine_rate)} (few days)`}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
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
    <Stack gap="xs">
      <Text component="h3" size="sm" fw={600}>
        {caption}
      </Text>
      <Table
        captionSide="top"
        withTableBorder
        withColumnBorders
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
                {row.sufficient_data && row.average_pain_severity !== null
                  ? `${row.average_pain_severity} / 10`
                  : row.average_pain_severity !== null
                    ? `${row.average_pain_severity} / 10 (few days)`
                    : '—'}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}

function InsightsContent({ insights }: { insights: DiaryInsights }) {
  const { summary, coverage, window_days } = insights
  return (
    <Stack gap="lg" className="diary-insights">
      <Text c="dimmed" size="sm">
        Patterns for the last {window_days} days ending {insights.today}. These
        statistics describe your diary only; they are not medical advice.
      </Text>
      {summary.insufficient_data ? (
        <Alert color="gray" title="More diary days needed">
          Record at least {summary.minimum_recorded_days} days in this window to
          see overall patterns. You have {summary.recorded_days} recorded days
          so far.
        </Alert>
      ) : (
        <Group gap="xl" align="flex-start" className="diary-insights-summary">
          <Stack gap={4}>
            <Text size="sm" c="dimmed">
              Recorded days
            </Text>
            <Text fw={600}>{summary.recorded_days}</Text>
          </Stack>
          <Stack gap={4}>
            <Text size="sm" c="dimmed">
              Migraine days
            </Text>
            <Text fw={600}>{summary.migraine_days}</Text>
          </Stack>
          <Stack gap={4}>
            <Text size="sm" c="dimmed">
              Overall migraine rate
            </Text>
            <Text fw={600}>{formatRate(summary.migraine_rate)}</Text>
          </Stack>
        </Group>
      )}
      <Text size="sm" c="dimmed">
        Detail coverage: sleep duration on {coverage.sleep_duration_answered}{' '}
        days, sleep quality on {coverage.sleep_quality_answered}, medication on{' '}
        {coverage.medication_answered}, pain severity on{' '}
        {coverage.pain_answered} migraine days.
      </Text>
      <WeekdayTable rows={insights.weekdays} />
      <SliceTable
        caption="Migraine rate by sleep duration"
        valueLabel="Sleep duration"
        rows={insights.sleep_duration}
      />
      <SliceTable
        caption="Migraine rate by sleep quality"
        valueLabel="Sleep quality"
        rows={insights.sleep_quality}
      />
      <SliceTable
        caption="Migraine rate when medication was recorded"
        valueLabel="Medication"
        rows={insights.medication}
      />
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
