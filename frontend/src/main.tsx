import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import './index.css'
import App from './App.tsx'
import { cssVariablesResolver, theme } from './theme'

const root = document.getElementById('root')
if (root === null) throw new Error('Application root is missing')
createRoot(root).render(
  <StrictMode>
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="light"
    >
      <App />
    </MantineProvider>
  </StrictMode>,
)
