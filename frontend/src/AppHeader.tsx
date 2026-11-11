import type { ReactNode } from 'react'
import {
  Button,
  Group,
  Stack,
  Text,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core'

type AppHeaderProps = { children?: ReactNode }

export default function AppHeader({ children }: AppHeaderProps) {
  const { toggleColorScheme } = useMantineColorScheme()
  const colorScheme = useComputedColorScheme('dark')

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
      <Group gap="sm">
        <Button variant="light" size="xs" onClick={() => toggleColorScheme()}>
          Switch to {colorScheme === 'dark' ? 'light' : 'dark'} mode
        </Button>
        {children}
      </Group>
    </Group>
  )
}
