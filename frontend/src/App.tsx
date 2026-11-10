import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Session = { user: { email: string } | null; csrfToken: string }
function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null || !('csrfToken' in value) || typeof value.csrfToken !== 'string' || !('user' in value)) return false
  return value.user === null || (typeof value.user === 'object' && 'email' in value.user && typeof value.user.email === 'string')
}
async function getSession(): Promise<Session> {
  const response = await fetch('/api/session/', { cache: 'no-store' })
  const body: unknown = await response.json()
  if (!response.ok || !isSession(body)) throw new Error('Session unavailable')
  return body
}
function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [page, setPage] = useState<'loading' | 'account' | 'diary' | 'unavailable'>('loading')
  const [mode, setMode] = useState<'sign-in' | 'register'>('sign-in')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [attempt, setAttempt] = useState(0)
  async function showSession(next: Session) {
    setSession(next)
    if (next.user) {
      const response = await fetch('/api/diary/', { cache: 'no-store' })
      const body: unknown = await response.json()
      if (!response.ok || typeof body !== 'object' || body === null || !('recordingAvailable' in body) || body.recordingAvailable !== false) throw new Error('Diary unavailable')
      setPage('diary')
    } else setPage('account')
  }
  useEffect(() => {
    let active = true
    void getSession().then(async next => { if (active) await showSession(next) }).catch(() => { if (active) setPage('unavailable') })
    return () => { active = false }
  }, [attempt])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || busy) return
    const form = event.currentTarget
    const values = new FormData(form)
    setBusy(true); setErrors([]); setNotice('')
    try {
      const response = await fetch(`/api/${mode}/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': session.csrfToken },
        body: JSON.stringify({ email: values.get('email'), password: values.get('password') }),
      })
      const body: unknown = await response.json()
      if (!response.ok) {
        const messages: string[] = []
        if (typeof body === 'object' && body !== null) for (const value of Object.values(body)) {
          if (typeof value === 'string') messages.push(value)
          else if (Array.isArray(value)) for (const item of value) if (typeof item === 'string') messages.push(item)
        }
        setErrors(response.status === 403
          ? ['Your session security check expired. Please try again. If it continues, refresh the page.']
          : messages.length ? messages : ['Unable to continue. Please try again.'])
        setSession(await getSession())
        return
      }
      if (!isSession(body)) throw new Error('Unexpected response')
      form.reset()
      try { await showSession(body) } catch { setPage('unavailable') }
    } catch { setErrors(['Unable to connect. Please try again.']) }
    finally { setBusy(false) }
  }
  async function signOut() {
    if (!session || busy) return
    setBusy(true); setErrors([])
    try {
      const response = await fetch('/api/sign-out/', { method: 'POST', headers: { 'X-CSRFToken': session.csrfToken } })
      const body: unknown = await response.json()
      if (!response.ok) {
        const current = await getSession()
        if (current.user === null) { await showSession(current); setNotice('You have signed out.'); return }
        setSession(current)
        throw new Error('Sign-out failed')
      }
      if (!isSession(body) || body.user !== null) throw new Error('Unexpected response')
      await showSession(body); setMode('sign-in'); setNotice('You have signed out.')
    } catch { setErrors(['Unable to sign out. Please try again.']) }
    finally { setBusy(false) }
  }
  return <main>
    <header><p className="brand">Migraine Diary</p><span className="local">Local preview · synthetic data only</span></header>
    {page === 'loading' && <p role="status">Checking your session…</p>}
    {page === 'unavailable' && <section><h1>Unable to connect</h1><p>Check that the local service is running, then try again.</p><button onClick={() => { setPage('loading'); setAttempt(value => value + 1) }}>Try again</button></section>}
    {page === 'account' && <section>
      <p className="eyebrow">A little space for you</p><h1>{mode === 'register' ? 'Create your account' : 'Welcome back'}</h1>
      <p className="intro">{mode === 'register' ? 'Start with an email and password.' : 'Sign in to open your diary.'}</p>
      <div className="switch" aria-label="Account options">{(['sign-in', 'register'] as const).map(option => <button key={option} aria-pressed={mode === option} disabled={busy} onClick={() => { setMode(option); setErrors([]); setNotice('') }}>{option === 'register' ? 'Create account' : 'Sign in'}</button>)}</div>
      {notice && <p role="status">{notice}</p>}
      <form onSubmit={event => { void submit(event) }}>
        <label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} disabled={busy} />
        <label htmlFor="password">Password</label><input key={mode} id="password" name="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required maxLength={1024} aria-describedby={mode === 'register' ? 'password-help' : undefined} disabled={busy} />
        {mode === 'register' && <p className="help" id="password-help">Use at least 8 characters. Avoid common passwords, only numbers, or a password similar to your email.</p>}
        {errors.length > 0 && <div className="errors" role="alert">{errors.map((message, index) => <p key={`${index}-${message}`}>{message}</p>)}</div>}
        <button className="primary" disabled={busy} type="submit">{busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}</button>
      </form><p className="footnote">Password recovery is not available in this local preview yet.</p>
    </section>}
    {page === 'diary' && <section><p className="eyebrow">Your space</p><h1>Your diary</h1><p>Signed in as <strong>{session?.user?.email}</strong></p><div className="placeholder"><h2>A place to keep track</h2><p>Your account is ready. Recording migraine days and migraine-free days is coming in the next diary increment.</p></div>{errors.length > 0 && <div className="errors" role="alert">{errors.map(message => <p key={message}>{message}</p>)}</div>}<button disabled={busy} onClick={() => { void signOut() }}>{busy ? 'Signing out…' : 'Sign out'}</button></section>}
  </main>
}
export default App
