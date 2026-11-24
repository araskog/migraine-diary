import { Button, Group, Text } from '@mantine/core'
import { DEMO_NOTICE_LABEL } from './demo'

type DemoNoticeProps = {
  busy?: boolean
  onCreateAccount: () => void
}

export default function DemoNotice({ busy, onCreateAccount }: DemoNoticeProps) {
  return (
    <Group justify="space-between" align="center" gap="sm" wrap="nowrap">
      <Text size="sm" c="dimmed">
        {DEMO_NOTICE_LABEL}
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
