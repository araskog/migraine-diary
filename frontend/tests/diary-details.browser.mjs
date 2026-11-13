// Open /static/app/tests/diary-details.html with the Vite dev server running.
import { createElement, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '../src/index.css'
import '../src/App.css'
import DiaryPage from '../src/DiaryPage'
import { emptyDetails, localDate } from '../src/diary'
import { theme, cssVariablesResolver } from '../src/theme'

const session = { csrfToken: 'synthetic', user: { email: 'test@example.test' } }
const entry = { date: localDate(), status: 'migraine', ...emptyDetails() }
let pending
let loads = 0
window.fetch = async (url, options) => {
  if (url === '/api/session/') return Response.json(session)
  if (url !== '/api/diary/entries/') throw new Error('Unexpected request')
  if (!options?.method) {
    loads += 1
    return Response.json([entry])
  }
  const { timezone: _timezone, ...saved } = JSON.parse(options.body)
  return new Promise((resolve) => {
    pending = () => {
      Object.assign(entry, saved)
      resolve(Response.json(entry))
    }
  })
}
createRoot(document.getElementById('root')).render(
  createElement(
    StrictMode,
    null,
    createElement(
      MantineProvider,
      { theme, cssVariablesResolver, defaultColorScheme: 'dark' },
      createElement(DiaryPage, {
        email: session.user.email,
        csrfToken: session.csrfToken,
        onSignedOut: () => {
          throw new Error('Unexpected sign-out')
        },
        onSessionRefreshed: () => {},
      }),
    ),
  ),
)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function waitFor(check) {
  const deadline = performance.now() + 3000
  while (!check()) {
    if (performance.now() > deadline)
      throw new Error('Timed out waiting for UI')
    await delay(16)
  }
}
function assert(condition, message) {
  if (!condition) throw new Error(message)
}
function appearance(node) {
  const style = getComputedStyle(node)
  return JSON.stringify({
    color: style.color,
    background: style.backgroundColor,
    opacity: style.opacity,
  })
}
document.getElementById('run').onclick = async (event) => {
  event.currentTarget.disabled = true
  const output = document.getElementById('results')
  let stage = 'loading details'
  try {
    await waitFor(() => document.querySelector('input[type="checkbox"]'))
    const calendar = document.querySelector('[aria-label="Diary calendar"]')
    const nodes = [...calendar.querySelectorAll('button')]
    const colors = nodes.map(appearance)
    const initialLoads = loads
    const selected = calendar.querySelector('button[data-selected]')
    const checkbox = document.querySelector('input[type="checkbox"]')
    for (let attempt = 0; attempt < 2; attempt += 1) {
      stage = `checkbox change ${attempt + 1}`
      pending = undefined
      checkbox.click()
      await waitFor(
        () =>
          selected.disabled ||
          selected.getAttribute('aria-disabled') === 'true',
      )
      assert(
        calendar.isConnected && nodes.every((node) => node.isConnected),
        'Calendar remounted during detail save',
      )
      nodes.forEach((node, index) =>
        assert(
          appearance(node) === colors[index],
          `Calendar appearance changed during detail save: ${node.getAttribute('aria-label')}`,
        ),
      )
      const other = nodes.find(
        (node) =>
          node !== selected &&
          node.getAttribute('aria-label')?.endsWith('Unrecorded'),
      )
      other?.click()
      await delay(32)
      assert(
        calendar.querySelector('button[data-selected]') === selected,
        'Calendar accepted a competing selection',
      )
      pending()
      await waitFor(() => selected.getAttribute('aria-disabled') === 'false')
      assert(
        nodes.every((node) => node.isConnected),
        'Calendar remounted after detail save',
      )
      assert(loads === initialLoads, 'Details triggered a diary reload')
    }
    // Let the completed-save notification settle before a new interaction.
    await delay(32)
    stage = 'opening status popup'
    pending = undefined
    selected.click()
    const freeAction = () =>
      [...document.querySelectorAll('button')].find(
        (button) =>
          button.textContent.trim().replace(/^[●○]\s*/, '') === 'Migraine-free',
      )
    await waitFor(freeAction)
    stage = 'changing to migraine-free'
    freeAction().click()
    await waitFor(() => pending)
    pending()
    await waitFor(() => !document.querySelector('[aria-label^="Details for"]'))
    output.textContent =
      'PASS Migraine-free hides details. Calendar colors and DOM remain stable during checkbox save and clear; competing selection blocked; no diary reload. All checks complete.'
  } catch (error) {
    output.textContent = `FAIL ${stage}: ${error.message}`
  }
}
