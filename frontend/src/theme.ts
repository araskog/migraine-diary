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
  variables: {},
  light: { '--mantine-color-dimmed': theme.colors.gray[7] },
  dark: {},
})
