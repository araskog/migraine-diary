import { useState } from 'react'
import { ActionIcon, Menu, Stack, Text } from '@mantine/core'
import AppHeader from './AppHeader'
import ErrorMessages from './ErrorMessages'
import DiaryEntries from './DiaryEntries'
import ConfirmDialog from './ConfirmDialog'
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
  const [saving, setSaving] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)
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
    <>
      <ConfirmDialog
        opened={confirmSignOut}
        title="Unsaved details"
        message="Discard your unfinished details and sign out?"
        confirmLabel="Discard and sign out"
        onClose={() => setConfirmSignOut(false)}
        onConfirm={() => {
          setConfirmSignOut(false)
          void signOut()
        }}
      />
      <AppHeader>
        <Menu position="bottom-end" width={260} shadow="md">
          <Menu.Target>
            <ActionIcon
              variant="subtle"
              className="account-toggle"
              color="var(--app-color-positive)"
              size={44}
              radius="xl"
              aria-label="Account menu"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
              </svg>
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>
              Signed in as
              <Text
                size="sm"
                c="var(--mantine-color-text)"
                style={{ overflowWrap: 'anywhere' }}
              >
                {email}
              </Text>
            </Menu.Label>
            <Menu.Divider />
            <Menu.Item
              disabled={busy || saving || statusSaving}
              onClick={() => {
                if (dirty) setConfirmSignOut(true)
                else void signOut()
              }}
            >
              {busy ? 'Signing out…' : 'Sign out'}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </AppHeader>
      <Stack component="section" gap="lg" className="page diary-page">
        <DiaryEntries
          csrfToken={csrfToken}
          disabled={busy || statusSaving}
          saving={saving || statusSaving}
          onStatusSavingChange={setStatusSaving}
          dirty={dirty}
          onDirtyChange={setDirty}
          onSavingChange={setSaving}
          onSignedOut={onSignedOut}
          onSessionRefreshed={onSessionRefreshed}
        />
        <ErrorMessages messages={errors} />
      </Stack>
    </>
  )
}
