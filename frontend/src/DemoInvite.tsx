import { Button, Flex } from '@mantine/core'

type DemoInviteProps = {
  busy?: boolean
  onStart: () => void
}

export default function DemoInvite({ busy, onStart }: DemoInviteProps) {
  return (
    <Flex justify="flex-end" mb="sm">
      <Button
        color="pink"
        radius="xl"
        size="md"
        aria-busy={busy}
        loading={busy}
        onClick={onStart}
      >
        Try the demo
      </Button>
    </Flex>
  )
}
