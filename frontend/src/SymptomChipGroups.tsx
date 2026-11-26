import { Chip, Group, Stack, Text } from '@mantine/core'
import { SYMPTOM_GROUPS } from './symptomCatalog'
import './SymptomChipGroups.css'

type SymptomChipGroupsProps = {
  value: string[]
  disabled: boolean
  id?: string
  onChange: (symptoms: string[], save?: boolean) => void
}

export default function SymptomChipGroups({
  value,
  disabled,
  id = 'symptoms-label',
  onChange,
}: SymptomChipGroupsProps) {
  return (
    <Stack gap="sm" className="symptom-chip-groups">
      <Chip.Group
        multiple
        value={value}
        aria-labelledby={id}
        onChange={(symptoms) => onChange(symptoms, true)}
      >
        <Stack gap="md">
          {SYMPTOM_GROUPS.map((group) => (
            <Stack key={group.label} gap="xs">
              <Text
                size="xs"
                fw={600}
                tt="uppercase"
                className="diary-details-secondary"
              >
                {group.label}
              </Text>
              <Group gap="xs" className="symptom-chip-row">
                {group.symptoms.map((symptom) => (
                  <Chip
                    key={symptom.code}
                    value={symptom.code}
                    variant="outline"
                    color="sage"
                    radius="sm"
                    disabled={disabled}
                    classNames={{ label: 'symptom-chip-label' }}
                  >
                    {symptom.label}
                  </Chip>
                ))}
              </Group>
            </Stack>
          ))}
        </Stack>
      </Chip.Group>
    </Stack>
  )
}
