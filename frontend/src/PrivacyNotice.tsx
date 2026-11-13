import { Anchor, Modal, ScrollArea, Stack, Text } from '@mantine/core'
import { useState } from 'react'

export const privacyVersion = '2026-11-13'

export default function PrivacyNotice() {
  const [opened, setOpened] = useState(false)
  return (
    <>
      <Anchor
        component="button"
        type="button"
        size="xs"
        c="dimmed"
        onClick={() => setOpened(true)}
      >
        Privacy
      </Anchor>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Your privacy"
        padding="lg"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Stack py="sm">
          <Text>
            We use your account details and the health information you choose to
            record to provide your saved diary.
          </Text>
          <Text>
            We rely on consent under GDPR Article 6(1)(a), with explicit consent
            under Article 9(2)(a) for health entries. You can correct entries in
            your diary and withdraw consent by using Delete account at the
            bottom of the diary. Withdrawal does not affect earlier lawful
            processing.
          </Text>
          <Text>
            Before deletion, you may request a copy of your data through the
            privacy contact.
          </Text>
          <Text>
            Migraine Diary is operated by Amanda Araskog. Contact:
            amanda.araskog@gmail.com. Hosting providers are Neon (database),
            Vercel (API) and Cloudflare (website).
          </Text>
          <Text>
            We retain your account and diary until you delete your account or
            withdraw consent. Deletion removes them from the active database.
            Deleted data may remain temporarily in protected recovery copies.
            Neon Free provides up to six hours of restore history; separate
            snapshots or copies may have different retention.
          </Text>
          <Text size="sm">Version {privacyVersion}</Text>
        </Stack>
      </Modal>
    </>
  )
}
