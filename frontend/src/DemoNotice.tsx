import { Button, Group, Paper, Text } from '@mantine/core'

import { DEMO_DISPLAY_NAME } from './demo'

type DemoNoticeProps = {
  busy?: boolean
  onCreateAccount: () => void
}

export default function DemoNotice({ busy, onCreateAccount }: DemoNoticeProps) {
  return (
    <Paper
      p="sm"
      radius="md"
      className="demo-notice"
      bg="var(--mantine-color-pink-light)"
      withBorder
      style={{ borderColor: 'var(--mantine-color-pink-outline)' }}
    >
      <Group justify="space-between" align="center" wrap="wrap" gap="xs">
        <Text size="sm">
          <Text span fw={600} component="span">
            {DEMO_DISPLAY_NAME} · Demo account:
          </Text>{' '}
          Explore the sample diary here. Create your own account when you are
          ready for an empty personal diary.
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
