import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Collapse,
  List,
  Paper,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react'
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

type InsightsPanelProps = {
  entries: DiaryEntry[]
  loading: boolean
  csrfToken: string
}

export default function InsightsPanel({
  entries,
  loading,
  csrfToken,
}: InsightsPanelProps) {
  const [opened, setOpened] = useState(false)
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

  useEffect(() => {
    if (!opened || loading) return
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
  }, [opened, loading, analysis, templateLines, fingerprint, csrfToken])

  const displayLines = lines ?? templateLines

  return (
    <Paper
      component="section"
      withBorder
      radius="md"
      p="md"
      aria-label="Insights"
    >
      <UnstyledButton
        type="button"
        onClick={() => setOpened((value) => !value)}
        aria-expanded={opened}
        w="100%"
      >
        <Stack gap={4}>
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div>
              <Text fw={600} size="sm">
                Insights
              </Text>
              <Text size="xs" c="dimmed">
                From your recorded diary days
              </Text>
            </div>
            {opened ? (
              <IconChevronDown size={18} aria-hidden />
            ) : (
              <IconChevronRight size={18} aria-hidden />
            )}
          </Box>
        </Stack>
      </UnstyledButton>
      <Collapse expanded={opened}>
        <Stack gap="sm" mt="md">
          {loading ? (
            <LoadingIndicator label="Loading diary" />
          ) : wordingBusy && lines === null ? (
            <LoadingIndicator label="Preparing insights" />
          ) : (
            <>
              <List size="sm" spacing="xs">
                {displayLines.map((line: string) => (
                  <List.Item key={line}>{line}</List.Item>
                ))}
              </List>
              <Text size="xs" c="dimmed">
                These observations reflect what you logged. They are not medical
                advice and do not prove cause and effect. Optional fields count
                only when you answered them.
                {aiWorded
                  ? ' Wording may use Cloudflare Workers AI on aggregated counts only.'
                  : ''}
              </Text>
            </>
          )}
        </Stack>
      </Collapse>
    </Paper>
  )
}
