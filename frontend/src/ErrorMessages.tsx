type ErrorMessagesProps = { messages: string[] }

export default function ErrorMessages({ messages }: ErrorMessagesProps) {
  if (messages.length === 0) return null
  return (
    <div className="errors" role="alert">
      {messages.map((message, index) => (
        <p key={`${index}-${message}`}>{message}</p>
      ))}
    </div>
  )
}
