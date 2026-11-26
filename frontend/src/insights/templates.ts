import { MAX_INSIGHT_LINES } from './constants.ts'
import type { InsightAnalysis, InsightFact } from './types.ts'

function percent(share: number): string {
  return `${Math.round(share * 100)}%`
}

function renderFact(fact: InsightFact): string {
  switch (fact.kind) {
    case 'weekday_peak':
      return `Most of your recorded migraine days fall on ${fact.weekday} (${fact.count} of ${fact.total}).`
    case 'sleep_duration_mode':
      return `On migraine days where you logged sleep duration, "${fact.label}" was the most common answer (${fact.count} of ${fact.answered} days, ${percent(fact.share)}).`
    case 'sleep_duration_weekday':
      return `${percent(fact.conditionalShare)} of migraine days with ${fact.sleepLabel.toLowerCase()} sleep were on ${fact.weekday} (${fact.cellCount} of ${fact.sleepTotal} days), compared with ${percent(fact.baselineShare)} of all migraine days.`
    case 'medication_share':
      return `On migraine days where you answered about medication, you reported taking medication on ${fact.yesCount} of ${fact.answered} days (${percent(fact.share)}).`
    default:
      return ''
  }
}

export function templateInsightLines(analysis: InsightAnalysis): string[] {
  if (analysis.migraineDayCount < 1) {
    return ['Log migraine days in your diary to see pattern insights.']
  }
  if (analysis.facts.length === 0) {
    return [
      'No strong patterns yet. Keep logging optional details such as sleep to see more insights.',
    ]
  }
  return analysis.facts
    .map(renderFact)
    .filter((line) => line.length > 0)
    .slice(0, MAX_INSIGHT_LINES)
}
