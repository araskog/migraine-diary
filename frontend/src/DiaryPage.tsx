import { useState } from 'react'
import {
  ActionIcon,
  Anchor,
  Box,
  Group,
  Button,
  Menu,
  Modal,
  PasswordInput,
  Stack,
  Text,
} from '@mantine/core'
import { IconUser } from '@tabler/icons-react'
import LoadingIndicator from './LoadingIndicator'
import AppHeader from './AppHeader'
import PrivacyNotice from './PrivacyNotice'
import ErrorMessages from './ErrorMessages'
import DiaryEntries from './DiaryEntries'
import ConfirmDialog from './ConfirmDialog'
import DemoNotice from './DemoNotice'
import { DEMO_DISPLAY_NAME } from './demo'
import { getSession, isSession } from './session'
import type { Session } from './session'

type DiaryPageProps = {
  email: string
  isDemo: boolean
  csrfToken: string
  onSignedOut: (session: Session, options?: { register?: boolean }) => void
  onSessionRefreshed: (session: Session) => void
}

export default function DiaryPage({
  email,
  isDemo,
  csrfToken,
  onSignedOut,
  onSessionRefreshed,
}: DiaryPageProps) {
  const [deleting, setDeleting] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState<
    false | 'sign-out' | 'create-account'
  >(false)
  const [errors, setErrors] = useState<string[]>([])

  function requestLeave(intent: 'sign-out' | 'create-account') {
    if (busy || saving || statusSaving) return
    if (dirty) setConfirmLeave(intent)
    else void leaveDemo(intent)
  }

  async function leaveDemo(intent: 'sign-out' | 'create-account') {
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
          onSignedOut(current, { register: intent === 'create-account' })
          return
        }
        onSessionRefreshed(current)
        throw new Error('Sign-out failed')
      }
      if (!isSession(body) || body.user !== null)
        throw new Error('Unexpected response')
      onSignedOut(body, { register: intent === 'create-account' })
    } catch {
      setErrors(['Unable to sign out. Please try again.'])
    } finally {
      setBusy(false)
    }
  }

  async function deleteAccount() {
    if (busy || saving || statusSaving) return
    setBusy(true)
    setErrors([])
    try {
      const response = await fetch('/api/account/delete/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({ password }),
      })
      const body: unknown = await response.json()
      if (!response.ok) {
        const current = await getSession()
        if (current.user === null) {
          onSignedOut(current)
          return
        }
        onSessionRefreshed(current)
        throw new Error('Deletion failed')
      }
      if (!isSession(body) || body.user !== null)
        throw new Error('Unexpected response')
      onSignedOut(body)
    } catch {
      setErrors([
        'Unable to delete account. Check your password and try again.',
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ConfirmDialog
        opened={confirmLeave !== false}
        title="Unsaved details"
        message={
          confirmLeave === 'create-account'
            ? 'Discard your unfinished details and continue to create your account?'
            : 'Discard your unfinished details and sign out?'
        }
        confirmLabel={
          confirmLeave === 'create-account'
            ? 'Continue to create account'
            : 'Discard and sign out'
        }
        onClose={() => setConfirmLeave(false)}
        onConfirm={() => {
          const intent = confirmLeave === false ? 'sign-out' : confirmLeave
          setConfirmLeave(false)
          void leaveDemo(intent)
        }}
      />
      <Modal
        opened={deleting}
        onClose={() => {
          if (!busy) {
            setDeleting(false)
            setPassword('')
          }
        }}
        title="Delete your account?"
      >
        <Stack gap="md">
          <Text>
            This withdraws consent and permanently deletes your account and
            diary from the active database. Before continuing, you may request a
            copy of your data through the privacy contact.
          </Text>
          <PasswordInput
            label="Confirm your password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            disabled={busy}
          />
          <ErrorMessages messages={errors} />
          <Button
            color="red"
            disabled={busy || saving || statusSaving || !password}
            onClick={() => {
              void deleteAccount()
            }}
          >
            Withdraw consent and delete account
          </Button>
        </Stack>
      </Modal>
      <AppHeader>
        <Menu position="bottom-end" width={260} shadow="md">
          <Menu.Target>
            <ActionIcon aria-label="Account menu">
              <IconUser size={22} stroke={1.8} aria-hidden />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>
              {isDemo ? 'Demo account' : 'Signed in as'}
              <Text
                size="sm"
                c="var(--mantine-color-text)"
                style={{ overflowWrap: 'anywhere' }}
              >
                {isDemo ? DEMO_DISPLAY_NAME : email}
              </Text>
            </Menu.Label>
            <Menu.Divider />
            <Menu.Item
              disabled={busy || saving || statusSaving}
              onClick={() => requestLeave('sign-out')}
            >
              {busy ? <LoadingIndicator label="Signing out" /> : 'Sign out'}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </AppHeader>
      {isDemo && (
        <Box mt="lg" mb="lg">
          <DemoNotice
            busy={busy || saving || statusSaving}
            onCreateAccount={() => requestLeave('create-account')}
          />
        </Box>
      )}
      <Stack
        component="section"
        gap="lg"
        className={`page diary-page${isDemo ? ' diary-page--demo' : ''}`}
      >
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
        <Group
          component="footer"
          justify={isDemo ? 'flex-end' : 'space-between'}
          align="center"
          gap="md"
          mt="xl"
          wrap="wrap"
        >
          <PrivacyNotice />
          {!isDemo && (
            <Anchor
              component="button"
              type="button"
              size="xs"
              c="dimmed"
              disabled={busy || saving || statusSaving}
              onClick={() => setDeleting(true)}
            >
              Delete account
            </Anchor>
          )}
        </Group>
      </Stack>
    </>
  )
}
