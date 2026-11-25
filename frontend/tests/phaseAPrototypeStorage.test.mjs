import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import {
  clearPhaseAStorage,
  clearStoredSymptoms,
  readPhaseAStorage,
  writePhaseAStorage,
} from '../src/phaseAPrototypeStorage.ts'

const store = new Map()

beforeEach(() => {
  store.clear()
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
  }
})

afterEach(() => {
  delete globalThis.localStorage
})

test('read returns empty when storage is missing', () => {
  assert.deepEqual(readPhaseAStorage('2026-11-10'), {
    symptoms: [],
    personal_note: '',
  })
})

test('write and read round-trip catalog symptoms and note', () => {
  writePhaseAStorage('2026-11-10', {
    symptoms: ['nausea', 'throbbing'],
    personal_note: 'Felt worse in the afternoon',
  })
  assert.deepEqual(readPhaseAStorage('2026-11-10'), {
    symptoms: ['nausea', 'throbbing'],
    personal_note: 'Felt worse in the afternoon',
  })
})

test('read drops unknown symptom codes', () => {
  store.set(
    'migraine-diary-phase-a:2026-11-10',
    JSON.stringify({ symptoms: ['nausea', 'not_a_code'], personal_note: '' }),
  )
  assert.deepEqual(readPhaseAStorage('2026-11-10'), {
    symptoms: ['nausea'],
    personal_note: '',
  })
})

test('read rejects overlong notes', () => {
  store.set(
    'migraine-diary-phase-a:2026-11-10',
    JSON.stringify({ symptoms: [], personal_note: 'x'.repeat(2001) }),
  )
  assert.deepEqual(readPhaseAStorage('2026-11-10'), {
    symptoms: [],
    personal_note: '',
  })
})

test('read tolerates invalid JSON', () => {
  store.set('migraine-diary-phase-a:2026-11-10', '{not json')
  assert.deepEqual(readPhaseAStorage('2026-11-10'), {
    symptoms: [],
    personal_note: '',
  })
})

test('clearStoredSymptoms keeps personal note', () => {
  writePhaseAStorage('2026-11-10', {
    symptoms: ['fatigue'],
    personal_note: 'Keep this',
  })
  clearStoredSymptoms('2026-11-10')
  assert.deepEqual(readPhaseAStorage('2026-11-10'), {
    symptoms: [],
    personal_note: 'Keep this',
  })
})

test('clearPhaseAStorage removes the entry', () => {
  writePhaseAStorage('2026-11-10', { symptoms: ['fatigue'], personal_note: '' })
  clearPhaseAStorage('2026-11-10')
  assert.deepEqual(readPhaseAStorage('2026-11-10'), {
    symptoms: [],
    personal_note: '',
  })
})
