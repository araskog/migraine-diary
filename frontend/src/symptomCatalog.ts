export type SymptomCode =
  (typeof SYMPTOM_GROUPS)[number]['symptoms'][number]['code']

export const SYMPTOM_GROUPS = [
  {
    label: 'Pain characteristics',
    symptoms: [
      { code: 'throbbing', label: 'Throbbing' },
      { code: 'pressure', label: 'Pressure' },
      { code: 'stabbing', label: 'Stabbing' },
      { code: 'one_sided', label: 'One-sided' },
      { code: 'both_sides', label: 'Both sides' },
      { code: 'neck_pain', label: 'Neck pain' },
    ],
  },
  {
    label: 'Sensory symptoms',
    symptoms: [
      { code: 'light_sensitivity', label: 'Light sensitivity' },
      { code: 'sound_sensitivity', label: 'Sound sensitivity' },
      { code: 'smell_sensitivity', label: 'Smell sensitivity' },
      { code: 'visual_aura', label: 'Visual aura' },
      { code: 'sensory_aura', label: 'Sensory aura' },
    ],
  },
  {
    label: 'Other symptoms',
    symptoms: [
      { code: 'nausea', label: 'Nausea' },
      { code: 'vomiting', label: 'Vomiting' },
      { code: 'dizziness', label: 'Dizziness' },
      { code: 'brain_fog', label: 'Brain fog' },
      { code: 'fatigue', label: 'Fatigue' },
      { code: 'difficulty_speaking', label: 'Difficulty speaking' },
    ],
  },
  {
    label: 'Early warning signs',
    symptoms: [
      { code: 'yawning', label: 'Yawning' },
      { code: 'food_cravings', label: 'Food cravings' },
      { code: 'neck_stiffness', label: 'Neck stiffness' },
      { code: 'mood_changes', label: 'Mood changes' },
      { code: 'frequent_urination', label: 'Frequent urination' },
      { code: 'unusual_tiredness', label: 'Unusual tiredness' },
    ],
  },
] as const

export const SYMPTOM_CODES = new Set(
  SYMPTOM_GROUPS.flatMap((group) =>
    group.symptoms.map((symptom) => symptom.code),
  ),
)
