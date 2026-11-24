import { Button } from '@mantine/core'

type DemoInviteProps = {
  busy?: boolean
  onStart: () => void
}

export default function DemoInvite({ busy, onStart }: DemoInviteProps) {
  return (
    <Button
      color="pink"
      radius="xl"
      size="compact-md"
      aria-busy={busy}
      loading={busy}
      onClick={onStart}
    >
      Try the demo
    </Button>
  )
}
