import { useState } from 'react'
import type { FormEvent } from 'react'
import ErrorMessages from './ErrorMessages'
import { getSession, isSession } from './session'
import type { Session } from './session'

type AccountFormProps = {
  csrfToken: string
  notice: string
  onAuthenticated: (session: Session) => Promise<void>
  onSessionRefreshed: (session: Session) => void
}

function responseErrors(body: unknown, status: number): string[] {
  if (status === 403)
    return [
      'Your session security check expired. Please try again. If it continues, refresh the page.',
    ]
  const messages: string[] = []
  if (typeof body === 'object' && body !== null) {
    for (const value of Object.values(body)) {
      if (typeof value === 'string') messages.push(value)
      else if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'string') messages.push(item)
        }
      }
    }
  }
  return messages.length ? messages : ['Unable to continue. Please try again.']
}

export default function AccountForm({
  csrfToken,
  notice,
  onAuthenticated,
  onSessionRefreshed,
}: AccountFormProps) {
  const [mode, setMode] = useState<'sign-in' | 'register'>('sign-in')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [showNotice, setShowNotice] = useState(true)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const values = new FormData(form)
    setBusy(true)
    setErrors([])
    setShowNotice(false)
    try {
      const response = await fetch(`/api/${mode}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          email: values.get('email'),
          password: values.get('password'),
        }),
      })
      const body: unknown = await response.json()
      if (!response.ok) {
        setErrors(responseErrors(body, response.status))
        onSessionRefreshed(await getSession())
        return
      }
      if (!isSession(body)) throw new Error('Unexpected response')
      form.reset()
      await onAuthenticated(body)
    } catch {
      setErrors(['Unable to connect. Please try again.'])
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <p className="eyebrow">A little space for you</p>
      <h1>{mode === 'register' ? 'Create your account' : 'Welcome back'}</h1>
      <p className="intro">
        {mode === 'register'
          ? 'Start with an email and password.'
          : 'Sign in to open your diary.'}
      </p>
      <div className="switch" aria-label="Account options">
        {(['sign-in', 'register'] as const).map((option) => (
          <button
            key={option}
            aria-pressed={mode === option}
            disabled={busy}
            onClick={() => {
              setMode(option)
              setErrors([])
              setShowNotice(false)
            }}
          >
            {option === 'register' ? 'Create account' : 'Sign in'}
          </button>
        ))}
      </div>
      {showNotice && notice && <p role="status">{notice}</p>}
      <form
        onSubmit={(event) => {
          void submit(event)
        }}
      >
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          disabled={busy}
        />
        <label htmlFor="password">Password</label>
        <input
          key={mode}
          id="password"
          name="password"
          type="password"
          autoComplete={
            mode === 'register' ? 'new-password' : 'current-password'
          }
          required
          maxLength={1024}
          aria-describedby={mode === 'register' ? 'password-help' : undefined}
          disabled={busy}
        />
        {mode === 'register' && (
          <p className="help" id="password-help">
            Use at least 8 characters. Avoid common passwords, only numbers, or
            a password similar to your email.
          </p>
        )}
        <ErrorMessages messages={errors} />
        <button className="primary" disabled={busy} type="submit">
          {busy
            ? 'Please wait…'
            : mode === 'register'
              ? 'Create account'
              : 'Sign in'}
        </button>
      </form>
      <p className="footnote">
        Password recovery is not available in this local preview yet.
      </p>
    </section>
  )
}
