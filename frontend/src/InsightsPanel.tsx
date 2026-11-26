import { useEffect, useMemo, useState } from 'react'
import {
  Accordion,
  Alert,
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
  const multiple = lines.length > 1
  return (
    <Stack gap={multiple ? 'sm' : 0}>
      {lines.map((line, index) => (
        <Paper
          key={line}
          component="article"
          p="md"
          radius="md"
          className={
            index === 0
              ? 'insights-panel-line insights-panel-line--lead'
              : 'insights-panel-line'
          }
        >
          <Group gap="md" wrap="nowrap" align="center">
            <ThemeIcon
              size={26}
              radius="xl"
              variant="light"
              color={index === 0 ? 'migraine' : 'sage'}
              aria-hidden
            >
              <Text span size="xs" fw={700} component="span">
                {index + 1}
              </Text>
            </ThemeIcon>
            <Text size="sm" lh={1.55} style={{ flex: 1, minWidth: 0 }}>
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
            <Group gap="sm" wrap="wrap" align="center">
              <Stack gap={2}>
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
              </Stack>
              <Group gap="xs">
                {hasFactInsights ? (
                  <Badge
                    size="sm"
                    variant="light"
                    color="sage"
                    visibleFrom="xs"
                  >
                    {analysis.facts.length}{' '}
                    {analysis.facts.length === 1 ? 'pattern' : 'patterns'}
                  </Badge>
                ) : null}
                {aiWorded ? (
                  <Badge
                    size="sm"
                    variant="light"
                    color="sage"
                    leftSection={<IconSparkles size={12} stroke={1.75} />}
                  >
                    AI wording
                  </Badge>
                ) : null}
              </Group>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md" className="insights-panel-body">
              {loading ? (
                <LoadingIndicator label="Loading diary" />
              ) : wordingBusy && lines === null ? (
                <LoadingIndicator label="Preparing insights" />
              ) : (
                <>
                  {aiWorded ? (
                    <Alert
                      variant="light"
                      color="sage"
                      radius="md"
                      icon={<IconSparkles size={18} stroke={1.75} />}
                      title="AI-assisted wording"
                    >
                      Cloudflare Workers AI rephrased these observations from
                      aggregated statistics only. The underlying facts match
                      your diary; nothing new was invented.
                    </Alert>
                  ) : null}
                  <InsightLineCards lines={displayLines} />
                  <Box className="insights-panel-disclaimer">
                    <Text size="xs" c="dimmed" lh={1.55}>
                      These observations reflect what you logged. They are not
                      medical advice and do not prove cause and effect.
                      {!aiWorded && hasFactInsights
                        ? ' Wording uses the built-in template from your stats.'
                        : ''}
                    </Text>
                  </Box>
                </>
              )}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Box>
  )
}
