import { useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Group,
  Paper,
  Progress,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import LoadingIndicator from './LoadingIndicator'
import ErrorMessages from './ErrorMessages'
import {
  formatRate,
  loadInsights,
  type DiaryInsights,
  type InsightsSlice,
  type InsightsWeekdaySlice,
} from './insights'
import './DiaryInsights.css'

type DiaryInsightsProps = {
  active: boolean
}

type StapleRow = {
  key: string
  label: string
  migraineDays: number
  sufficientData: boolean
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
      {hint ? (
        <Text size="xs" c="dimmed" mt={4}>
          {hint}
        </Text>
      ) : null}
    </Paper>
  )
}

function orderStapleRows<T extends { migraine_days: number }>(rows: T[]): T[] {
  const withMigraine = rows
    .filter((row) => row.migraine_days > 0)
    .sort((a, b) => b.migraine_days - a.migraine_days)
  const withoutMigraine = rows.filter((row) => row.migraine_days === 0)
  return [...withMigraine, ...withoutMigraine]
}

function weekdayStaples(rows: InsightsWeekdaySlice[]): StapleRow[] {
  return orderStapleRows(rows).map((row) => ({
    key: String(row.weekday),
    label: row.label.slice(0, 3),
    migraineDays: row.migraine_days,
    sufficientData: row.sufficient_data,
  }))
}

function sliceStaples(rows: InsightsSlice[]): StapleRow[] {
  const logged = rows.filter((row) => row.recorded_days > 0)
  if (logged.length === 0) return []
  return orderStapleRows(logged).map((row) => ({
    key: String(row.value),
    label: row.label,
    migraineDays: row.migraine_days,
    sufficientData: row.sufficient_data,
  }))
}

function MigraineStapleChart({
  title,
  description,
  staples,
}: {
  title: string
  description: string
  staples: StapleRow[]
}) {
  if (staples.length === 0) {
    return (
      <Paper withBorder radius="md" p="md" className="diary-insights-section">
        <Text fw={600} size="sm">
          {title}
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          Log more days with this detail to see a pattern.
        </Text>
      </Paper>
    )
  }

  const maxMigraineDays = Math.max(...staples.map((row) => row.migraineDays), 1)

  return (
    <Paper withBorder radius="md" p="md" className="diary-insights-section">
      <Text fw={600} size="sm">
        {title}
      </Text>
      <Text size="xs" c="dimmed" mt={4}>
        {description}
      </Text>
      <div className="diary-insights-staples" role="list">
        {staples.map((row) => {
          const heightPercent = (row.migraineDays / maxMigraineDays) * 100
          return (
            <div
              key={row.key}
              className="diary-insights-staple"
              role="listitem"
            >
              <Text
                size="sm"
                fw={600}
                ta="center"
                className="diary-insights-staple-count"
              >
                {row.migraineDays}
              </Text>
              <div
                className="diary-insights-staple-track"
                aria-label={`${row.label}: ${row.migraineDays} migraine days`}
              >
                <div
                  className="diary-insights-staple-bar"
                  style={{
                    height:
                      row.migraineDays === 0
                        ? 0
                        : `${Math.max(heightPercent, 4)}%`,
                  }}
                />
              </div>
              <Stack gap={2} align="center" mt={6}>
                <Text
                  size="xs"
                  ta="center"
                  className="diary-insights-staple-label"
                >
                  {row.label}
                </Text>
                {!row.sufficientData ? (
                  <Badge size="xs" variant="light" color="gray">
                    Few answers
                  </Badge>
                ) : null}
              </Stack>
            </div>
          )
        })}
      </div>
    </Paper>
  )
}

function formatAveragePain(
  average: number | null,
  answeredDays: number,
): string {
  if (average === null || answeredDays === 0) return '—'
  return `${average} / 10`
}

function medicationTakenDays(insights: DiaryInsights): number {
  const taken = insights.medication.find((row) => row.value === true)
  return taken?.recorded_days ?? 0
}

function InsightsContent({ insights }: { insights: DiaryInsights }) {
  const { summary, window_days } = insights
  const ratePercent = Math.round((summary.migraine_rate ?? 0) * 100)
  const medDays = medicationTakenDays(insights)

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

      <StatCard
        label="Medication taken"
        value={medDays}
        hint={`Days you logged taking medication in the last ${window_days} days`}
      />

      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
        <StatCard label="Migraine-free" value={summary.migraine_free_days} />
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
        <Stack gap="md">
          <MigraineStapleChart
            title="By weekday"
            description="Migraine days per weekday (highest on the left)."
            staples={weekdayStaples(insights.weekdays)}
          />
          <MigraineStapleChart
            title="Sleep duration"
            description="Migraine days when each sleep duration was logged."
            staples={sliceStaples(insights.sleep_duration)}
          />
          <MigraineStapleChart
            title="Sleep quality"
            description="Migraine days when each sleep quality was logged."
            staples={sliceStaples(insights.sleep_quality)}
          />
        </Stack>
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
