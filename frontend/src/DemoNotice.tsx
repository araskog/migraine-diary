import { Button, Group, Paper, Text } from '@mantine/core'
import { DEMO_NOTICE_LABEL } from './demo'

type DemoNoticeProps = {
  busy?: boolean
  onCreateAccount: () => void
}

export default function DemoNotice({ busy, onCreateAccount }: DemoNoticeProps) {
  return (
    <Paper radius="md" px="sm" py={6} className="demo-notice-banner">
      <Group justify="space-between" align="center" gap="sm" wrap="nowrap">
        <Text size="sm" className="demo-notice-banner-text">
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
    </Paper>
  )
}
