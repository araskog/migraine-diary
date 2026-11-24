import { Button, Group, Text } from '@mantine/core'

import { DemoBubblePanel } from './DemoBubble'

type DemoNoticeProps = {
  busy?: boolean
  onCreateAccount: () => void
}

export default function DemoNotice({ busy, onCreateAccount }: DemoNoticeProps) {
  return (
    <DemoBubblePanel tail="calendar" className="demo-notice">
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Text size="sm" className="demo-bubble-text">
          Sample diary — explore how it works. Create your own account when you
          are ready.
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
    </DemoBubblePanel>
  )
}
