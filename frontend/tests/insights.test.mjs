import assert from 'node:assert/strict'
import { afterEach, mock, test } from 'node:test'
import { isDiaryInsights, loadInsights } from '../src/insights.ts'

const sampleInsights = {
  schema_version: 1,
  window_days: 90,
  today: '2026-01-15',
  summary: {
    recorded_days: 12,
    migraine_days: 4,
    migraine_free_days: 8,
    migraine_rate: 0.333,
    insufficient_data: false,
    minimum_recorded_days: 10,
  },
  coverage: {
    sleep_duration_answered: 10,
    sleep_quality_answered: 9,
    medication_answered: 8,
    pain_answered: 4,
  },
  weekdays: [
    {
      weekday: 0,
      label: 'Monday',
      recorded_days: 2,
      migraine_days: 1,
      migraine_rate: 0.5,
      sufficient_data: false,
    },
  ],
  sleep_duration: [
    {
      value: 'less',
      label: 'Less than usual',
      recorded_days: 4,
      migraine_days: 2,
      migraine_rate: 0.5,
      sufficient_data: true,
    },
  ],
  sleep_quality: [],
  medication: [],
  pain_by_sleep_duration: [],
  pain_by_sleep_quality: [],
  pain_by_medication: [],
}

afterEach(() => mock.restoreAll())

test('insights validation accepts a structured payload', () => {
  assert.equal(isDiaryInsights(sampleInsights), true)
  assert.equal(
    isDiaryInsights({ ...sampleInsights, schema_version: '1' }),
    false,
  )
})

test('loading passes timezone and accepts validated responses', async () => {
  mock.method(globalThis, 'fetch', async (url, options) => {
    assert.match(url, /^\/api\/diary\/insights\/\?timezone=/)
    assert.equal(options.cache, 'no-store')
    return Response.json(sampleInsights)
  })
  const loaded = await loadInsights(new AbortController().signal)
  assert.deepEqual(loaded.summary.recorded_days, 12)
})
