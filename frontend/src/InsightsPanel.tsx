import { useEffect, useMemo, useState } from 'react'
import {
  Accordion,
  Badge,
  Box,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'
import { IconBulb, IconSparkles } from '@tabler/icons-react'
import {
  analyzeInsightFacts,
  buildInsightsFingerprint,
  fetchNarratedInsightLines,
  hashInsightsFingerprint,
  readNarrateCache,
  templateInsightLines,
  writeNarrateCache,
  MIN_MIGRAINE_DAYS,
} from './insights/index.ts'
import type { DiaryEntry } from './diary'
import LoadingIndicator from './LoadingIndicator'
import './InsightsPanel.css'

type InsightsPanelProps = {
  entries: DiaryEntry[]
  loading: boolean
  csrfToken: string
}

function InsightLineCards({ lines }: { lines: string[] }) {
  return (
    <Stack gap="xs">
      {lines.map((line, index) => (
        <Paper
          key={line}
          component="article"
          p="sm"
          radius="lg"
          withBorder
          className={
            index === 0
              ? 'insights-panel-line insights-panel-line--lead'
              : 'insights-panel-line'
          }
        >
          <Group gap="sm" wrap="nowrap" align="flex-start">
            <ThemeIcon
              size={28}
              radius="xl"
              variant="light"
              color={index === 0 ? 'migraine' : 'sage'}
              aria-hidden
            >
              <Text span size="xs" fw={700} component="span">
                {index + 1}
              </Text>
            </ThemeIcon>
            <Text size="sm" lh={1.5} style={{ flex: 1 }}>
              {line}
            </Text>
          </Group>
        </Paper>
      ))}
    </Stack>
  )
}

export default function InsightsPanel({
  entries,
  loading,
  csrfToken,
}: InsightsPanelProps) {
  const [opened, setOpened] = useState<string | null>(null)
  const [lines, setLines] = useState<string[] | null>(null)
  const [wordingBusy, setWordingBusy] = useState(false)
  const [aiWorded, setAiWorded] = useState(false)

  const analysis = useMemo(() => analyzeInsightFacts(entries), [entries])
  const templateLines = useMemo(
    () => templateInsightLines(analysis),
    [analysis],
  )
  const fingerprint = useMemo(
    () => buildInsightsFingerprint(entries),
    [entries],
  )
  const isOpen = opened === 'insights'
  const hasFactInsights =
    analysis.migraineDayCount >= MIN_MIGRAINE_DAYS && analysis.facts.length > 0

  useEffect(() => {
    if (!isOpen || loading) return
    if (analysis.migraineDayCount < MIN_MIGRAINE_DAYS) {
      setLines(templateLines)
      setAiWorded(false)
      return
    }
    if (analysis.facts.length === 0) {
      setLines(templateLines)
      setAiWorded(false)
      return
    }

    const cached = readNarrateCache(fingerprint)
    if (cached) {
      setLines(cached)
      setAiWorded(true)
      return
    }

    const controller = new AbortController()
    async function narrate() {
      setWordingBusy(true)
      const digest = await hashInsightsFingerprint(fingerprint)
      const aiLines = await fetchNarratedInsightLines(
        digest,
        analysis.facts,
        csrfToken,
        controller.signal,
      )
      if (controller.signal.aborted) return
      if (aiLines && aiLines.length > 0) {
        writeNarrateCache(fingerprint, aiLines)
        setLines(aiLines)
        setAiWorded(true)
      } else {
        setLines(templateLines)
        setAiWorded(false)
      }
      setWordingBusy(false)
    }
    void narrate()
    return () => controller.abort()
  }, [isOpen, loading, analysis, templateLines, fingerprint, csrfToken])

  const displayLines = lines ?? templateLines

  return (
    <Box component="section" aria-label="Insights" className="insights-panel">
      <Accordion
      radius="lg"
        value={opened}
        onChange={setOpened}
        chevronPosition="right"
      >
        <Accordion.Item value="insights">
          <Accordion.Control
            icon={
              <ThemeIcon size={32} radius="md" color="sage" variant="light">
                <IconBulb size={18} stroke={1.75} aria-hidden />
              </ThemeIcon>
            }
          >
            <Group gap="xs" wrap="wrap">
              <div>
                <Text
                  fw={700}
                  size="sm"
                  c="light-dark(var(--mantine-color-sage-9), var(--mantine-color-sage-2))"
                >
                  Insights
                </Text>
                <Text size="xs" c="dimmed">
                  From your recorded diary days
                </Text>
              </div>
              {hasFactInsights ? (
                <Badge size="sm" variant="light" color="sage" visibleFrom="xs">
                  {analysis.facts.length}{' '}
                  {analysis.facts.length === 1 ? 'pattern' : 'patterns'}
                </Badge>
              ) : null}
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              {loading ? (
                <LoadingIndicator label="Loading diary" />
              ) : wordingBusy && lines === null ? (
                <LoadingIndicator label="Preparing insights" />
              ) : (
                <>
                  {aiWorded ? (
                    <Group gap={6}>
                      <ThemeIcon
                        size="sm"
                        radius="xl"
                        color="sage"
                        variant="transparent"
                        aria-hidden
                      >
                        <IconSparkles size={14} stroke={1.75} />
                      </ThemeIcon>
                      <Text
                        size="xs"
                        c="light-dark(var(--mantine-color-sage-8), var(--mantine-color-sage-3))"
                      >
                        AI wording from your stats
                      </Text>
                    </Group>
                  ) : null}
                  <InsightLineCards lines={displayLines} />
                  <Paper
                    component="p"
                    p="sm"
                    radius="lg"
                    className="insights-panel-disclaimer"
                  >
                    <Text size="xs" c="dimmed" lh={1.55}>
                      These observations reflect what you logged. They are not
                      medical advice and do not prove cause and effect.
                      {aiWorded
                        ? ' Wording may use Cloudflare Workers AI on aggregated counts only.'
                        : ''}
                    </Text>
                  </Paper>
                </>
              )}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Box>
  )
}
