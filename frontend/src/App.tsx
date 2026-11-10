import { useEffect, useState } from 'react'
import './App.css'

type Status = 'checking' | 'connected' | 'unavailable'

function App() {
  const [status, setStatus] = useState<Status>('checking')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    async function checkConnection() {
      try {
        const response = await fetch('/api/health/', { signal: controller.signal })
        const body: unknown = await response.json()
        if (!response.ok || typeof body !== 'object' || body === null ||
            !('status' in body) || body.status !== 'ok') {
          throw new Error('Service unavailable')
        }
        setStatus('connected')
      } catch {
        if (!controller.signal.aborted) setStatus('unavailable')
      }
    }
    void checkConnection()
    return () => controller.abort()
  }, [attempt])

  const messages: Record<Status, string> = {
    checking: 'Checking local connection…',
    connected: 'Connected to the local service and database.',
    unavailable: 'The local service is unavailable. Check that Django and PostgreSQL are running.',
  }

  return (
    <main>
      <p className="eyebrow">Local development</p>
      <h1>Migraine Diary</h1>
      <p>The foundation is ready for the next step. Accounts and diary recording are coming later.</p>
      <section aria-label="Connection status">
        <h2>Connection</h2>
        <p role="status">{messages[status]}</p>
        <button disabled={status === 'checking'} onClick={() => {
          setStatus('checking')
          setAttempt(value => value + 1)
        }}>Check again</button>
      </section>
    </main>
  )
}

export default App
