import assert from 'node:assert/strict'
import { afterEach, mock, test } from 'node:test'
import {
  emptyDetails,
  isDiaryDate,
  loadEntries,
  localDate,
  saveEntry,
  statusLabel,
} from '../src/diary.ts'

afterEach(() => mock.restoreAll())

test('calendar date follows local time rather than UTC', () => {
  assert.equal(localDate(new Date(2026, 0, 2, 0, 5)), '2026-01-02')
  assert.equal(localDate(new Date(2026, 11, 31, 23, 55)), '2026-12-31')
})

test('loading accepts both statuses and passes cancellation and no-cache options', async () => {
  const entries = [
    { date: '2026-11-10', status: 'migraine_free', ...emptyDetails() },
    { date: '2026-11-09', status: 'migraine', ...emptyDetails() },
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
  const entry = { date: '2026-11-10', status: 'migraine', ...emptyDetails() }
  mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/diary/entries/')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers['X-CSRFToken'], 'synthetic-csrf')
    assert.deepEqual(JSON.parse(options.body), {
      date: entry.date,
      status: entry.status,
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

test('saving optional details retains explicit no and zero and sends clearing values', async () => {
  for (const details of [
    {
      medication_taken: false,
      medication_name: '',
      sleep: 'okay',
      sleep_duration: 'usual',
      pain_severity: 0,
    },
    {
      medication_taken: true,
      medication_name: 'Synthetic medication',
      sleep: 'poor',
      sleep_duration: 'less',
      pain_severity: 10,
    },
    emptyDetails(),
  ]) {
    mock.method(globalThis, 'fetch', async (_url, options) => {
      const body = JSON.parse(options.body)
      for (const [key, value] of Object.entries(details))
        assert.deepEqual(body[key], value)
      return Response.json({ date: body.date, status: body.status, ...details })
    })
    assert.deepEqual(
      await saveEntry('2026-11-10', 'migraine', 'synthetic-csrf', details),
      { date: '2026-11-10', status: 'migraine', ...details },
    )
    mock.restoreAll()
  }
})

test('malformed optional details never become a successful load', async () => {
  for (const invalid of [
    { pain_severity: 11 },
    { pain_severity: 1.5 },
    { medication_taken: 'no' },
    { medication_name: null },
    { sleep: 'bad' },
    { sleep: null },
    { sleep_duration: 'unknown' },
    { sleep_duration: null },
  ]) {
    mock.method(globalThis, 'fetch', async () =>
      Response.json([
        {
          date: '2026-11-10',
          status: 'migraine',
          ...emptyDetails(),
          ...invalid,
        },
      ]),
    )
    await assert.rejects(loadEntries(new AbortController().signal))
    mock.restoreAll()
  }
})
