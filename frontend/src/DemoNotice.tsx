import { Alert, Button, Group, Text } from '@mantine/core'

type DemoNoticeProps = {
  busy?: boolean
  onCreateAccount: () => void
}

export default function DemoNotice({ busy, onCreateAccount }: DemoNoticeProps) {
  return (
    <Alert
      variant="light"
      color="blue"
      title="Demo sample diary"
      className="demo-notice"
    >
      <Text size="sm">
        You are editing synthetic sample data so you can try the calendar and
        details. Changes stay in this demo session until you create an account.
      </Text>
      <Group mt="sm">
        <Button size="sm" disabled={busy} onClick={onCreateAccount}>
          Create account from demo
        </Button>
      </Group>
    </Alert>
  )
}
