import {
  Anchor,
  Group,
  Checkbox,
  Input,
  Select,
  Slider,
  Stack,
  TextInput,
} from '@mantine/core'
import type { DiaryDetails, DiaryStatus } from './diary'

type DiaryDetailsFieldsProps = {
  status: DiaryStatus
  value: DiaryDetails
  disabled: boolean
  onChange: (value: DiaryDetails, save?: boolean) => void
}

export default function DiaryDetailsFields({
  status,
  value,
  disabled,
  onChange,
}: DiaryDetailsFieldsProps) {
  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Checkbox
          label="I took migraine medication"
          checked={value.medication_taken === true}
          disabled={disabled}
          onChange={(event) => {
            const checked = event.currentTarget.checked
            onChange({
              ...value,
              medication_taken: checked,
              medication_name: checked ? value.medication_name : '',
            })
          }}
        />
        {value.medication_taken === true && (
          <TextInput
            label="Which medication?"
            placeholder="Medication name"
            maxLength={200}
            value={value.medication_name}
            disabled={disabled}
            onBlur={() => onChange(value)}
            onChange={(event) =>
              onChange(
                { ...value, medication_name: event.currentTarget.value },
                false,
              )
            }
          />
        )}
      </Stack>
      <Select
        label="How was your sleep quality?"
        placeholder="Select quality"
        data={[
          { value: 'poor', label: 'Poor' },
          { value: 'okay', label: 'Okay' },
          { value: 'good', label: 'Good' },
        ]}
        value={value.sleep || null}
        clearable
        clearButtonProps={{ 'aria-label': 'Clear sleep answer' }}
        disabled={disabled}
        onChange={(sleep) => {
          if (
            sleep === null ||
            sleep === 'poor' ||
            sleep === 'okay' ||
            sleep === 'good'
          )
            onChange({ ...value, sleep: sleep ?? '' })
        }}
      />
      <Select
        label="How long did you sleep?"
        placeholder="Select duration"
        data={[
          { value: 'less', label: 'Less than usual' },
          { value: 'usual', label: 'Usual' },
          { value: 'more', label: 'More than usual' },
        ]}
        value={value.sleep_duration || null}
        clearable
        clearButtonProps={{ 'aria-label': 'Clear sleep duration answer' }}
        disabled={disabled}
        onChange={(duration) => {
          if (
            duration === null ||
            duration === 'less' ||
            duration === 'usual' ||
            duration === 'more'
          )
            onChange({ ...value, sleep_duration: duration ?? '' })
        }}
      />
      {status === 'migraine' && (
        <Input.Wrapper
          label="How severe was the pain at its worst?"
          description={
            value.pain_severity === null
              ? 'Not answered'
              : `${value.pain_severity} out of 10`
          }
        >
          <Stack gap="xs" mt="xs">
            <Slider
              min={0}
              max={10}
              step={1}
              value={value.pain_severity ?? 0}
              color={value.pain_severity === null ? 'gray' : 'sage'}
              thumbLabel="Worst pain severity"
              thumbValueText={
                value.pain_severity === null
                  ? 'Not answered'
                  : `${value.pain_severity} out of 10`
              }
              marks={[{ value: 0 }, { value: 10 }]}
              disabled={disabled}
              onChangeEnd={(pain_severity) =>
                onChange({ ...value, pain_severity })
              }
              onChange={(pain_severity) =>
                onChange({ ...value, pain_severity }, false)
              }
            />
            <Group justify="space-between" wrap="nowrap" gap="xs">
              <Input.Description>0 · No pain</Input.Description>
              <Input.Description>10 · Worst</Input.Description>
            </Group>
            {value.pain_severity !== null && (
              <Anchor
                component="button"
                type="button"
                size="xs"
                c="dimmed"
                w="fit-content"
                disabled={disabled}
                onClick={() => onChange({ ...value, pain_severity: null })}
              >
                Clear pain answer
              </Anchor>
            )}
          </Stack>
        </Input.Wrapper>
      )}
    </Stack>
  )
}
