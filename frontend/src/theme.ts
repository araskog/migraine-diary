import {
  ActionIcon,
  Button,
  createTheme,
  Loader,
  Modal,
  Paper,
  SegmentedControl,
} from '@mantine/core'
import type { CSSVariablesResolver } from '@mantine/core'

export const theme = createTheme({
  primaryColor: 'sage',
  primaryShade: 7,
  defaultRadius: 'md',
  black: '#263b31',
  components: {
    Loader: Loader.extend({
      defaultProps: { type: 'dots', color: 'var(--app-color-positive)' },
    }),
    Button: Button.extend({
      defaultProps: { color: 'sage', autoContrast: true },
    }),
    SegmentedControl: SegmentedControl.extend({
      defaultProps: { color: 'sage', autoContrast: true },
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: {
        variant: 'default',
        size: 44,
        radius: 'xl',
        color: 'sage',
      },
    }),
    Modal: Modal.extend({
      defaultProps: { padding: 'lg', radius: 'lg', centered: true },
    }),
    Paper: Paper.extend({
      defaultProps: { radius: 'lg' },
    }),
  },
  colors: {
    migraine: [
      '#fdeced',
      '#f9d2d4',
      '#f3aeb2',
      '#ec878d',
      '#e46971',
      '#e85d65',
      '#d64f57',
      '#c43f47',
      '#a8333a',
      '#8f2b31',
    ],
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
    '--app-intro-background': theme.colors.sage[1],
    '--app-brand-text': theme.black,
    '--mantine-color-dimmed': theme.colors.gray[7],
    '--app-control-background': theme.colors.sage[0],
    '--app-color-positive': theme.colors.sage[8],
    '--app-insights-surface': theme.white,
    '--app-insights-control-idle':
      'color-mix(in srgb, var(--mantine-color-sage-0) 45%, white)',
    '--app-insights-control-hover':
      'color-mix(in srgb, var(--mantine-color-sage-1) 70%, white)',
    '--app-insights-line-surface': theme.colors.gray[0],
    '--app-insights-border': theme.colors.sage[2],
    '--app-insights-chevron': theme.colors.sage[7],
    '--app-insights-shell-shadow':
      '0 1px 2px color-mix(in srgb, var(--mantine-color-sage-9) 6%, transparent)',
    '--app-insights-line-shadow':
      '0 1px 2px color-mix(in srgb, var(--mantine-color-sage-9) 4%, transparent)',
  },
  dark: {
    '--app-intro-background':
      'color-mix(in srgb, var(--mantine-color-body), #a8c3a5 8%)',
    '--app-brand-text': theme.colors.sage[1],
    '--mantine-color-text': theme.colors.gray[0],
    '--mantine-color-dimmed': theme.colors.gray[3],
    '--app-control-background': theme.colors.dark[6],
    '--app-color-positive': theme.colors.sage[3],
    '--app-insights-surface': theme.colors.dark[7],
    '--app-insights-control-idle': theme.colors.dark[6],
    '--app-insights-control-hover': theme.colors.dark[5],
    '--app-insights-line-surface': theme.colors.dark[6],
    '--app-insights-border': theme.colors.dark[4],
    '--app-insights-chevron': theme.colors.sage[3],
    '--app-insights-shell-shadow': 'none',
    '--app-insights-line-shadow': 'none',
  },
})
