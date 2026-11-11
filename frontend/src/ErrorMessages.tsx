import { Alert, Stack, Text } from '@mantine/core'

type ErrorMessagesProps = { messages: string[] }

export default function ErrorMessages({ messages }: ErrorMessagesProps) {
  if (messages.length === 0) return null
  return (
    <Alert color="red" role="alert">
      <Stack gap="xs">
        {messages.map((message, index) => (
          <Text size="sm" key={`${index}-${message}`}>
            {message}
          </Text>
        ))}
      </Stack>
    </Alert>
  )
}
