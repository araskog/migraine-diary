// Open /static/app/tests/diary-interactions.html with the Vite dev server running.
// Exercise the real diary tree and styles; hold synthetic API responses until
// pending-state checks finish. No backend or real diary data is used.
import { createElement, Profiler, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '../src/index.css'
import '../src/App.css'
import DiaryPage from '../src/DiaryPage'
import { emptyDetails, localDate, dateLabel, statusLabel } from '../src/diary'
import { theme, cssVariablesResolver } from '../src/theme'

const session = { csrfToken: 'synthetic', user: { email: 'test@example.test' } }
let pending
let writes = 0
let loads = 0
let commits = 0
window.fetch = async (url, options) => {
  if (url === '/api/session/') return Response.json(session)
  if (url !== '/api/diary/entries/')
    throw new Error(`Unexpected request: ${url}`)
  if (!options?.method) {
    loads += 1
    return Response.json([])
  }
  writes += 1
  const body = JSON.parse(options.body)
  return new Promise((resolve) => {
    pending = (failed = false) => {
      resolve(
        failed
          ? Response.json({}, { status: 500 })
          : options.method === 'DELETE'
            ? new Response(null, { status: 204 })
            : Response.json({ ...emptyDetails(), date: body.date, status: body.status }),
      )
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
      createElement(
        Profiler,
        {
          id: 'diary',
          onRender: () => {
            commits += 1
          },
        },
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
function action(label) {
  return [...document.querySelectorAll('button')].find(
    (button) => button.textContent.trim().replace(/^[●○]\s*/, '') === label,
  )
}
function appearance(element) {
  const style = getComputedStyle(element)
  return JSON.stringify({
    color: style.color,
    background: style.backgroundColor,
    opacity: style.opacity,
    cursor: style.cursor,
  })
}
const dayLabel = (status) => `${dateLabel(localDate())}, ${statusLabel(status)}`
const day = (status) =>
  document.querySelector(`button[aria-label="${dayLabel(status)}"]`)

document.getElementById('run').onclick = async (event) => {
  event.currentTarget.disabled = true
  const output = document.getElementById('results')
  const results = []
  const pass = (message) => {
    results.push(`PASS ${message}`)
    output.textContent = results.join('\n')
  }
  try {
    await waitFor(() => day())
    const calendar = document.querySelector('[aria-label="Diary calendar"]')
    const days = [...calendar.querySelectorAll('button')]
    const initialLoads = loads

    async function start(label) {
      // Let the popover's opening transition and initial focus trap settle.
      await delay(200)
      const button = action(label)
      assert(button, `${label} is missing`)
      button.focus()
      const before = appearance(button)
      const count = writes
      button.click()
      await waitFor(
        () =>
          button.disabled || button.getAttribute('aria-disabled') === 'true',
      )
      assert(document.activeElement === button, 'Saving moved keyboard focus')
      assert(
        appearance(button) === before,
        'Action appearance changed while saving',
      )
      assert(
        calendar.isConnected && days.every((node) => node.isConnected),
        'Calendar remounted',
      )
      assert(
        !calendar.querySelector('button.calendar-day-busy') ||
          getComputedStyle(calendar.querySelector('button.calendar-day-busy'))
            .cursor !== 'not-allowed',
        'Calendar uses a prohibited cursor while saving',
      )
      button.click()
      await delay(32)
      assert(writes === count + 1, 'Repeated activation sent another write')
      pass(
        `${label}: stable appearance/focus/calendar; repeat activation blocked`,
      )
    }

    for (const [label, status] of [
      ['Migraine', 'migraine'],
      ['Migraine-free', 'migraine_free'],
    ]) {
      const previousStatus = label === 'Migraine' ? undefined : 'migraine'
      day(previousStatus).click()
      await waitFor(() => action(label))
      const commitStart = commits
      await start(label)
      assert(day(previousStatus), 'Calendar changed before confirmation')
      pending()
      await waitFor(() => day(status))
      if (!previousStatus)
        assert(!action('Clear day'), 'Clear day appeared during first close')
      await waitFor(() => !action(label))
      pass(
        `${label}: confirmed marker, no loading restart (${commits - commitStart} subtree commits)`,
      )
    }

    day('migraine_free').click()
    await waitFor(() => action('Clear day'))
    await start('Clear day')
    pending(true)
    await waitFor(() => action('Try again'))
    assert(day('migraine_free'), 'Failed clear removed the saved marker')
    pass('Failed clear retains the saved marker and exposes retry')
    const beforeRetry = writes
    await start('Try again')
    action('Clear day').click()
    await delay(32)
    assert(writes === beforeRetry + 1, 'Retry allowed a competing write')
    pending()
    await waitFor(() => day())
    await waitFor(() => !action('Try again'))
    assert(loads === initialLoads, 'Saving triggered an entries reload')
    assert(
      calendar.isConnected && days.every((node) => node.isConnected),
      'Calendar replaced after save',
    )
    let settled = commits
    let stableSince = performance.now()
    await waitFor(() => {
      if (commits !== settled) {
        settled = commits
        stableSince = performance.now()
      }
      return performance.now() - stableSince > 350
    })
    pass(
      'Retry clears the day; calendar DOM survives; no reload or render loop',
    )
    pass(`All checks complete at ${window.innerWidth}px viewport`)
  } catch (error) {
    output.textContent = [...results, `FAIL ${error.message}`].join('\n')
  }
}
