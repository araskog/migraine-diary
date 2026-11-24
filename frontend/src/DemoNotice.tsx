import { Button, Group, Paper, Text } from '@mantine/core'
import { DEMO_NOTICE_DESKTOP, DEMO_NOTICE_MOBILE } from './demo'

type DemoNoticeProps = {
  busy?: boolean
  compact?: boolean
  onCreateAccount: () => void
}

export default function DemoNotice({
  busy,
  compact = false,
  onCreateAccount,
}: DemoNoticeProps) {
  const label = compact ? DEMO_NOTICE_MOBILE : DEMO_NOTICE_DESKTOP

  if (compact) {
    return (
      <Group justify="space-between" align="center" gap="sm" wrap="nowrap">
        <Text size="sm" c="dimmed">
          {label}
        </Text>
        <Button
          size="compact-sm"
          color="pink"
          disabled={busy}
          onClick={onCreateAccount}
        >
          Create account
        </Button>
      </Group>
    )
  }

  return (
    <Paper radius="md" p="sm" mb="xs" bg="pink.6">
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Text size="sm" c="white">
          {label}
        </Text>
        <Button
          size="compact-sm"
          variant="white"
          color="pink"
          disabled={busy}
          onClick={onCreateAccount}
        >
          Create account
        </Button>
      </Group>
    </Paper>
  )
}
