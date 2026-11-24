import { DemoBubbleButton } from './DemoBubble'

type DemoInviteProps = {
  busy?: boolean
  onStart: () => void
}

export default function DemoInvite({ busy, onStart }: DemoInviteProps) {
  return (
    <div className="account-demo-slot">
      <DemoBubbleButton tail="login" busy={busy} onClick={onStart}>
        Try the demo
      </DemoBubbleButton>
    </div>
  )
}
