import { Button, Paper, Stack, Text, Title } from '@mantine/core'

type DemoInviteProps = {
  busy?: boolean
  onStart: () => void
}

export default function DemoInvite({ busy, onStart }: DemoInviteProps) {
  return (
    <Paper
      component="section"
      aria-labelledby="demo-invite-title"
      p="lg"
      radius="md"
      className="demo-invite"
      bg="var(--mantine-color-pink-light)"
      withBorder
      style={{ borderColor: 'var(--mantine-color-pink-outline)' }}
    >
      <Stack gap="sm">
        <Title order={2} id="demo-invite-title" c="pink.4" size="h3">
          Try the demo!
        </Title>
        <Text size="sm">
          Open a sample diary with migraine days already filled in—no account
          needed.
        </Text>
        <Button
          color="pink"
          size="md"
          loading={busy}
          aria-busy={busy}
          onClick={onStart}
        >
          Open demo diary
        </Button>
      </Stack>
    </Paper>
  )
}
