import { useState } from 'react'
import ErrorMessages from './ErrorMessages'
import { getSession, isSession } from './session'
import type { Session } from './session'

type DiaryPageProps = {
  email: string
  csrfToken: string
  onSignedOut: (session: Session) => void
  onSessionRefreshed: (session: Session) => void
}

export default function DiaryPage({
  email,
  csrfToken,
  onSignedOut,
  onSessionRefreshed,
}: DiaryPageProps) {
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  async function signOut() {
    if (busy) return
    setBusy(true)
    setErrors([])
    try {
      const response = await fetch('/api/sign-out/', {
        method: 'POST',
        headers: { 'X-CSRFToken': csrfToken },
      })
      const body: unknown = await response.json()
      if (!response.ok) {
        const current = await getSession()
        if (current.user === null) {
          onSignedOut(current)
          return
        }
        onSessionRefreshed(current)
        throw new Error('Sign-out failed')
      }
      if (!isSession(body) || body.user !== null)
        throw new Error('Unexpected response')
      onSignedOut(body)
    } catch {
      setErrors(['Unable to sign out. Please try again.'])
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <p className="eyebrow">Your space</p>
      <h1>Your diary</h1>
      <p>
        Signed in as <strong>{email}</strong>
      </p>
      <div className="placeholder">
        <h2>A place to keep track</h2>
        <p>
          Your account is ready. Recording migraine days and migraine-free days
          is coming in the next diary increment.
        </p>
      </div>
      <ErrorMessages messages={errors} />
      <button
        disabled={busy}
        onClick={() => {
          void signOut()
        }}
      >
        {busy ? 'Signing out…' : 'Sign out'}
      </button>
    </section>
  )
}
