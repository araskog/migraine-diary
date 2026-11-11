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
      <Group gap="xs" wrap="nowrap" className="app-brand">
        <svg
          className="app-brand-icon"
          viewBox="0 0 128 128"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          {' '}
          <path d="M87 10C59 4 25 25 20 55 14 87 36 112 62 113c13 0 23-8 28-20-8 11-16 16-27 16-24 0-37-24-32-49C36 33 59 11 87 10Z" />
          <path d="M73 76C68 72 54 59 54 49c0-7 4-11 9-10 5 0 7 5 8 9 3-6 7-10 12-9 7 2 6 9 3 15-3 8-9 16-13 22Z" />
          <path
            d="M73 109c8-6 14-15 17-26"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path d="M82 99c-1-16 8-36 25-42 7 16-8 34-25 42Z" />
          <path d="M85 103c11-10 24-12 32-7-6 12-21 15-32 7Z" />
          <path d="M79 106c-11-3-14-11-12-20 10 2 14 10 12 20Z" />
        </svg>
        <Text className="app-brand-name">Migraine Diary</Text>
      </Group>
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
