import type { DiaryEntry } from '../diary.ts'
import {
  COMPOUND_LIFT_FACTOR,
  MAX_INSIGHT_LINES,
  MIN_COMPOUND_CELL_DAYS,
  MIN_MIGRAINE_DAYS,
  SLEEP_DURATION_LABELS,
  WEEKDAY_LABELS,
} from './constants.ts'
import type { InsightAnalysis, InsightFact } from './types.ts'
import { weekdayIndexFromDate, weekdayLabelFromDate } from './weekday.ts'

function migraineDays(entries: DiaryEntry[]): DiaryEntry[] {
  return entries.filter((entry) => entry.status === 'migraine')
}

function weekdayPeakFact(days: DiaryEntry[]): InsightFact | null {
  const total = days.length
  if (total === 0) return null
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const day of days) {
    counts[weekdayIndexFromDate(day.date)] += 1
  }
  let best = 0
  for (let index = 1; index < counts.length; index += 1) {
    if (counts[index] > counts[best]) best = index
  }
  if (counts[best] === 0) return null
  const share = counts[best] / total
  return {
    kind: 'weekday_peak',
    weekday: WEEKDAY_LABELS[best],
    count: counts[best],
    total,
    share,
    score: share * counts[best],
  }
}

function sleepDurationModeFact(days: DiaryEntry[]): InsightFact | null {
  const answered = days.filter((day) => day.sleep_duration !== '')
  if (answered.length < MIN_COMPOUND_CELL_DAYS) return null
  const counts: Record<'less' | 'usual' | 'more', number> = {
    less: 0,
    usual: 0,
    more: 0,
  }
  for (const day of answered) {
    const value = day.sleep_duration
    if (value === 'less' || value === 'usual' || value === 'more') {
      counts[value] += 1
    }
  }
  let best: 'less' | 'usual' | 'more' = 'less'
  if (counts.usual > counts[best]) best = 'usual'
  if (counts.more > counts[best]) best = 'more'
  if (counts[best] === 0) return null
  return {
    kind: 'sleep_duration_mode',
    value: best,
    label: SLEEP_DURATION_LABELS[best],
    count: counts[best],
    answered: answered.length,
    share: counts[best] / answered.length,
    score: (counts[best] / answered.length) * counts[best],
  }
}

function medicationShareFact(days: DiaryEntry[]): InsightFact | null {
  const answered = days.filter((day) => day.medication_taken !== null)
  if (answered.length < MIN_COMPOUND_CELL_DAYS) return null
  const yesCount = answered.filter(
    (day) => day.medication_taken === true,
  ).length
  if (yesCount === 0) return null
  return {
    kind: 'medication_share',
    yesCount,
    answered: answered.length,
    share: yesCount / answered.length,
    score: (yesCount / answered.length) * yesCount,
  }
}

function compoundSleepWeekdayFacts(days: DiaryEntry[]): InsightFact[] {
  const total = days.length
  if (total < MIN_MIGRAINE_DAYS) return []
  const baseline = [0, 0, 0, 0, 0, 0, 0]
  for (const day of days) {
    baseline[weekdayIndexFromDate(day.date)] += 1
  }
  const results: InsightFact[] = []
  const sleepValues = ['less', 'usual', 'more'] as const
  for (const sleep of sleepValues) {
    const subset = days.filter((day) => day.sleep_duration === sleep)
    if (subset.length < MIN_COMPOUND_CELL_DAYS) continue
    const subsetByWeekday = [0, 0, 0, 0, 0, 0, 0]
    for (const day of subset) {
      subsetByWeekday[weekdayIndexFromDate(day.date)] += 1
    }
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const cellCount = subsetByWeekday[weekday]
      if (cellCount < MIN_COMPOUND_CELL_DAYS) continue
      const conditionalShare = cellCount / subset.length
      const baselineShare = baseline[weekday] / total
      if (baselineShare === 0) continue
      const lift = conditionalShare / baselineShare
      if (lift < COMPOUND_LIFT_FACTOR) continue
      const sampleDate = subset.find(
        (day) => weekdayIndexFromDate(day.date) === weekday,
      )?.date
      if (!sampleDate) continue
      results.push({
        kind: 'sleep_duration_weekday',
        sleepLabel: SLEEP_DURATION_LABELS[sleep],
        weekday: weekdayLabelFromDate(sampleDate),
        cellCount,
        sleepTotal: subset.length,
        conditionalShare,
        baselineShare,
        lift,
        score: (lift - 1) * cellCount,
      })
    }
  }
  return results
}

function dedupeFacts(facts: InsightFact[]): InsightFact[] {
  const weekdaysInCompound = new Set(
    facts
      .filter((fact) => fact.kind === 'sleep_duration_weekday')
      .map((fact) => fact.weekday),
  )
  return facts.filter((fact) => {
    if (fact.kind !== 'weekday_peak') return true
    return !weekdaysInCompound.has(fact.weekday)
  })
}

export function analyzeInsightFacts(entries: DiaryEntry[]): InsightAnalysis {
  const migraine = migraineDays(entries)
  const migraineDayCount = migraine.length
  if (migraineDayCount < MIN_MIGRAINE_DAYS) {
    return { sufficientData: false, migraineDayCount, facts: [] }
  }
  const candidates: InsightFact[] = []
  const weekday = weekdayPeakFact(migraine)
  if (weekday) candidates.push(weekday)
  const sleepMode = sleepDurationModeFact(migraine)
  if (sleepMode) candidates.push(sleepMode)
  const medication = medicationShareFact(migraine)
  if (medication) candidates.push(medication)
  candidates.push(...compoundSleepWeekdayFacts(migraine))
  const ranked = dedupeFacts(candidates)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_INSIGHT_LINES)
  return {
    sufficientData: ranked.length > 0,
    migraineDayCount,
    facts: ranked,
  }
}
