import { Button } from '@mantine/core'

import DemoBubble from './DemoBubble'

type DemoInviteProps = {
  busy?: boolean
  onStart: () => void
}

export default function DemoInvite({ busy, onStart }: DemoInviteProps) {
  return (
    <DemoBubble tail="login">
      <Button
        color="pink"
        size="md"
        fullWidth
        loading={busy}
        aria-busy={busy}
        onClick={onStart}
      >
        Try the demo
      </Button>
    </DemoBubble>
  )
}
