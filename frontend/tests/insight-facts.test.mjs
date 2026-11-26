import assert from 'node:assert/strict'
import test from 'node:test'
import { analyzeInsightFacts } from '../src/insights/analyze.ts'
import { MIN_MIGRAINE_DAYS_COMPOUND } from '../src/insights/constants.ts'
import { templateInsightLines } from '../src/insights/templates.ts'
import { emptyDetails } from '../src/diary.ts'

function migraineDay(date, details = {}) {
  return {
    date,
    status: 'migraine',
    ...emptyDetails(),
    ...details,
  }
}

test('no migraine days yields guidance templates', () => {
  const analysis = analyzeInsightFacts([])
  assert.equal(analysis.sufficientData, false)
  assert.equal(analysis.migraineDayCount, 0)
  const lines = templateInsightLines(analysis)
  assert.match(lines[0], /Log migraine days/)
})

test('one migraine day yields weekday peak for narrate', () => {
  const analysis = analyzeInsightFacts([migraineDay('2026-01-06')])
  assert.equal(analysis.migraineDayCount, 1)
  assert.ok(analysis.facts.length >= 1)
  const peak = analysis.facts.find((fact) => fact.kind === 'weekday_peak')
  assert.ok(peak)
  assert.equal(peak.weekday, 'Tuesday')
  assert.equal(peak.count, 1)
  assert.ok(analysis.sufficientData)
})

test('few migraine days skip compound facts until compound minimum', () => {
  const analysis = analyzeInsightFacts([
    migraineDay('2026-01-06'),
    migraineDay('2026-01-08'),
    migraineDay('2026-01-13'),
  ])
  assert.equal(analysis.migraineDayCount, 3)
  assert.ok(analysis.facts.length >= 1)
  assert.ok(
    !analysis.facts.some((fact) => fact.kind === 'sleep_duration_weekday'),
  )
  assert.ok(analysis.migraineDayCount < MIN_MIGRAINE_DAYS_COMPOUND)
})

test('compound sleep duration and weekday is ranked', () => {
  const mondays = [
    '2026-01-05',
    '2026-01-12',
    '2026-01-19',
    '2026-01-26',
    '2026-02-02',
  ]
  const wednesdays = ['2026-01-07', '2026-01-14', '2026-01-21']
  const entries = [
    ...mondays.map((date) => migraineDay(date, { sleep_duration: 'more' })),
    ...wednesdays.map((date) => migraineDay(date, { sleep_duration: 'usual' })),
  ]
  const analysis = analyzeInsightFacts(entries)
  assert.ok(analysis.facts.length >= 1)
  const compound = analysis.facts.find(
    (fact) => fact.kind === 'sleep_duration_weekday',
  )
  assert.ok(compound, 'expected compound fact')
  assert.ok(compound.lift >= 1.5)
})

test('weekday peak uses majority weekday on migraine days', () => {
  const mondays = [
    migraineDay('2026-01-05'),
    migraineDay('2026-01-12'),
    migraineDay('2026-01-19'),
    migraineDay('2026-01-26'),
    migraineDay('2026-02-02'),
  ]
  const analysis = analyzeInsightFacts(mondays)
  const peak = analysis.facts.find((fact) => fact.kind === 'weekday_peak')
  assert.ok(peak)
  assert.equal(peak.weekday, 'Monday')
  assert.equal(peak.count, 5)
})
