import { Button, createTheme, SegmentedControl } from '@mantine/core'
import type { CSSVariablesResolver } from '@mantine/core'

export const theme = createTheme({
  primaryColor: 'sage',
  primaryShade: 7,
  defaultRadius: 'md',
  black: '#263b31',
  components: {
    Button: Button.extend({
      defaultProps: { color: 'sage', autoContrast: true },
    }),
    SegmentedControl: SegmentedControl.extend({
      defaultProps: { color: 'sage', autoContrast: true },
    }),
  },
  colors: {
    sage: [
      '#edf2ed',
      '#e1ecdf',
      '#c8dbc5',
      '#a8c3a5',
      '#86a983',
      '#638b65',
      '#466f4e',
      '#315c46',
      '#294e3c',
      '#203f31',
    ],
  },
})

export const cssVariablesResolver: CSSVariablesResolver = (theme) => ({
  variables: {
    '--app-migraine': '#e85d65',
    '--app-calendar-selected': theme.colors.sage[9],
    '--app-calendar-selected-hover': '#182f25',
  },
  light: {
    '--app-brand-text': theme.black,
    '--mantine-color-dimmed': theme.colors.gray[7],
    '--app-control-background': theme.colors.sage[0],
    '--app-color-positive': theme.colors.sage[8],
  },
  dark: {
    '--app-brand-text': theme.colors.sage[1],
    '--mantine-color-text': theme.colors.gray[0],
    '--mantine-color-dimmed': theme.colors.gray[3],
    '--app-control-background': theme.colors.dark[6],
    '--app-color-positive': theme.colors.sage[3],
  },
})
