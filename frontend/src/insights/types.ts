export type InsightFact =
  | {
      kind: 'weekday_peak'
      weekday: string
      count: number
      total: number
      share: number
      score: number
    }
  | {
      kind: 'sleep_duration_mode'
      value: 'less' | 'usual' | 'more'
      label: string
      count: number
      answered: number
      share: number
      score: number
    }
  | {
      kind: 'sleep_duration_weekday'
      sleepLabel: string
      weekday: string
      cellCount: number
      sleepTotal: number
      conditionalShare: number
      baselineShare: number
      lift: number
      score: number
    }
  | {
      kind: 'medication_share'
      yesCount: number
      answered: number
      share: number
      score: number
    }

export type InsightAnalysis = {
  sufficientData: boolean
  migraineDayCount: number
  facts: InsightFact[]
}
