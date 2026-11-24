import { Button } from '@mantine/core'

type DemoInviteProps = {
  busy?: boolean
  onStart: () => void
}

export default function DemoInvite({ busy, onStart }: DemoInviteProps) {
  return (
    <Button
      className="app-brand-demo"
      color="pink"
      radius="xl"
      variant="light"
      aria-busy={busy}
      loading={busy}
      onClick={onStart}
    >
      Try the demo
    </Button>
  )
}
