import type { ReactNode } from 'react'
import {
  ActionIcon,
  Group,
  Text,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core'

type AppHeaderProps = { children?: ReactNode }

export default function AppHeader({ children }: AppHeaderProps) {
  const { toggleColorScheme } = useMantineColorScheme()
  const colorScheme = useComputedColorScheme('dark')
  const themeLabel = `Switch to ${colorScheme === 'dark' ? 'light' : 'dark'} mode`

  return (
    <Group
      component="header"
      justify="space-between"
      gap="sm"
      wrap="nowrap"
      className="app-header"
    >
      <Text fw={700} size="lg">
        Migraine Diary
      </Text>
      <Group gap="xs" wrap="nowrap">
        <Tooltip label={themeLabel}>
          <ActionIcon
            variant="subtle"
            color="var(--mantine-color-text)"
            size={44}
            radius="xl"
            aria-label={themeLabel}
            onClick={() => toggleColorScheme()}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {colorScheme === 'dark' ? (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4" />
                </>
              ) : (
                <path d="M21 12.8A9 9 0 0 1 11.2 3 9 9 0 1 0 21 12.8Z" />
              )}
            </svg>
          </ActionIcon>
        </Tooltip>
        {children}
      </Group>
    </Group>
  )
}
