import type { ReactNode } from 'react'
import { Group, Stack, Text } from '@mantine/core'

type AppHeaderProps = { children?: ReactNode }

export default function AppHeader({ children }: AppHeaderProps) {
  return (
    <Group
      component="header"
      justify="space-between"
      gap="md"
      className="app-header"
    >
      <Stack gap={2}>
        <Text fw={700} size="lg">
          Migraine Diary
        </Text>
        <Text c="dimmed" size="xs">
          Local preview · synthetic data only
        </Text>
      </Stack>
      {children}
    </Group>
  )
}
