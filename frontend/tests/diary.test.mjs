import assert from 'node:assert/strict'
import { afterEach, mock, test } from 'node:test'
import {
  isDiaryDate,
  clearEntry,
  loadEntries,
  localDate,
  saveEntry,
  statusLabel,
} from '../src/diary.ts'

afterEach(() => mock.restoreAll())

test('clearing sends a protected date-specific request and accepts an empty response', async () => {
  mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/diary/entries/')
    assert.equal(options.method, 'DELETE')
    assert.equal(options.headers['X-CSRFToken'], 'synthetic-csrf')
    assert.deepEqual(JSON.parse(options.body), {
      date: '2026-11-10',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
    return new Response(null, { status: 204 })
  })
  await clearEntry('2026-11-10', 'synthetic-csrf')
})

test('clearing rejects failures and unexpected success responses', async () => {
  for (const status of [200, 400, 403, 500]) {
    mock.method(globalThis, 'fetch', async () => Response.json({}, { status }))
    await assert.rejects(clearEntry('2026-11-10', 'synthetic-csrf'))
    mock.restoreAll()
  }
  mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('offline')
  })
  await assert.rejects(clearEntry('2026-11-10', 'synthetic-csrf'))
})

test('calendar date follows local time rather than UTC', () => {
  assert.equal(localDate(new Date(2026, 0, 2, 0, 5)), '2026-01-02')
  assert.equal(localDate(new Date(2026, 11, 31, 23, 55)), '2026-12-31')
})

test('loading accepts both statuses and passes cancellation and no-cache options', async () => {
  const entries = [
    { date: '2026-11-10', status: 'migraine_free' },
    { date: '2026-11-09', status: 'migraine' },
  ]
  const signal = new AbortController().signal
  mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/diary/entries/')
    assert.equal(options.signal, signal)
    assert.equal(options.cache, 'no-store')
    return Response.json(entries)
  })
  assert.deepEqual(await loadEntries(signal), entries)
})

test('malformed or unauthorized loads do not become an empty diary', async () => {
  for (const response of [
    Response.json({ detail: 'Sign in required' }, { status: 403 }),
    Response.json([{ date: '2026-11-10', status: 'unknown' }]),
    Response.json({ results: [] }),
  ]) {
    mock.method(globalThis, 'fetch', async () => response)
    await assert.rejects(loadEntries(new AbortController().signal))
    mock.restoreAll()
  }
})

test('saving sends CSRF, device timezone and a calendar date without a user ID', async () => {
  const entry = { date: '2026-11-10', status: 'migraine' }
  mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/diary/entries/')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers['X-CSRFToken'], 'synthetic-csrf')
    assert.deepEqual(JSON.parse(options.body), {
      ...entry,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
    return Response.json(entry, { status: 201 })
  })
  assert.deepEqual(
    await saveEntry(entry.date, entry.status, 'synthetic-csrf'),
    entry,
  )
})

test('failed writes and invalid success bodies are rejected', async () => {
  for (const response of [
    Response.json({ date: ['Future date'] }, { status: 400 }),
    Response.json({ detail: 'CSRF failed' }, { status: 403 }),
    Response.json({}, { status: 200 }),
  ]) {
    mock.method(globalThis, 'fetch', async () => response)
    await assert.rejects(saveEntry('2026-11-10', 'migraine', 'synthetic-csrf'))
    mock.restoreAll()
  }
})

test('connection failures propagate instead of reporting success', async () => {
  mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('offline')
  })
  await assert.rejects(loadEntries(new AbortController().signal))
  await assert.rejects(saveEntry('2026-11-10', 'migraine', 'synthetic-csrf'))
})

test('response dates are real calendar dates, including leap years', () => {
  for (const value of ['2024-02-29', '2026-11-11'])
    assert.equal(isDiaryDate(value), true)
  for (const value of [
    '2026-02-29',
    '2026-02-30',
    '2026-13-01',
    '2026-11-11T00:00:00Z',
    null,
  ])
    assert.equal(isDiaryDate(value), false)
})

test('unrecorded dates are distinct from explicit migraine-free dates', () => {
  assert.equal(statusLabel(), 'Unrecorded')
  assert.equal(statusLabel('migraine'), 'Migraine')
  assert.equal(statusLabel('migraine_free'), 'Migraine-free')
})
