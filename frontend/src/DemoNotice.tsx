import { Button, Group, Paper, Text } from '@mantine/core'

type DemoNoticeProps = {
  busy?: boolean
  onCreateAccount: () => void
}

export default function DemoNotice({ busy, onCreateAccount }: DemoNoticeProps) {
  return (
    <Paper radius="md" p="sm" mb="xs" bg="pink.6">
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Text size="sm" c="white">
          Explore the Migraine Diary. Create your own account when you are
          ready.
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
