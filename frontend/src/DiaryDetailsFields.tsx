import { useState } from 'react'
import {
  Anchor,
  Button,
  Group,
  Checkbox,
  Input,
  Select,
  Slider,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import type { DiaryDetails, DiaryStatus } from './diary'
import SymptomChipGroups from './SymptomChipGroups'

type DiaryDetailsFieldsProps = {
  status: DiaryStatus
  value: DiaryDetails
  disabled: boolean
  onChange: (value: DiaryDetails, save?: boolean) => void
}

function SeveritySlider({
  label,
  thumbLabel,
  value,
  lowLabel,
  highLabel,
  clearLabel,
  disabled,
  onChange,
}: {
  label: string
  thumbLabel: string
  value: number | null
  lowLabel: string
  highLabel: string
  clearLabel: string
  disabled: boolean
  onChange: (value: number | null, save?: boolean) => void
}) {
  return (
    <Input.Wrapper
      label={label}
      description={value === null ? 'Not answered' : `${value} out of 10`}
    >
      <Stack gap="xs" mt="xs">
        <Slider
          min={0}
          max={10}
          step={1}
          value={value ?? 0}
          color={value === null ? 'gray' : 'sage'}
          thumbLabel={thumbLabel}
          thumbValueText={
            value === null ? 'Not answered' : `${value} out of 10`
          }
          marks={[{ value: 0 }, { value: 10 }]}
          disabled={disabled}
          onChangeEnd={(next) => onChange(next)}
          onChange={(next) => onChange(next, false)}
        />
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Input.Description>{lowLabel}</Input.Description>
          <Input.Description>{highLabel}</Input.Description>
        </Group>
        {value !== null && (
          <Anchor
            component="button"
            type="button"
            size="xs"
            c="dimmed"
            w="fit-content"
            disabled={disabled}
            onClick={() => onChange(null)}
          >
            {clearLabel}
          </Anchor>
        )}
      </Stack>
    </Input.Wrapper>
  )
}

export default function DiaryDetailsFields({
  status,
  value,
  disabled,
  onChange,
}: DiaryDetailsFieldsProps) {
  const [noteOpen, setNoteOpen] = useState(
    () => value.personal_note.trim().length > 0,
  )
  const noteVisible = noteOpen || value.personal_note.length > 0

  return (
    <Stack gap="md">
      {status === 'migraine' && (
        <>
          <SymptomChipGroups
            value={value.symptoms}
            disabled={disabled}
            onChange={(symptoms, save) =>
              onChange({ ...value, symptoms }, save)
            }
          />
          <SeveritySlider
            label="How stressed did you feel?"
            thumbLabel="Stress level"
            lowLabel="0 · None"
            highLabel="10 · Extreme"
            clearLabel="Clear stress answer"
            value={value.stress}
            disabled={disabled}
            onChange={(stress, save = true) =>
              onChange({ ...value, stress }, save)
            }
          />
          <Stack gap="xs">
            {!noteVisible ? (
              <Button
                variant="subtle"
                size="compact-sm"
                disabled={disabled}
                onClick={() => setNoteOpen(true)}
              >
                Add a personal note
              </Button>
            ) : (
              <Textarea
                label="Personal note"
                description="Optional. Plain text, up to 2,000 characters."
                placeholder="Anything you want to remember about today"
                autosize
                minRows={3}
                maxLength={2000}
                value={value.personal_note}
                disabled={disabled}
                onBlur={() => onChange(value)}
                onChange={(event) =>
                  onChange(
                    { ...value, personal_note: event.currentTarget.value },
                    false,
                  )
                }
              />
            )}
            {noteVisible && value.personal_note.length === 0 && (
              <Anchor
                component="button"
                type="button"
                size="xs"
                c="dimmed"
                w="fit-content"
                disabled={disabled}
                onClick={() => setNoteOpen(false)}
              >
                Hide note
              </Anchor>
            )}
          </Stack>
        </>
      )}
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
        <SeveritySlider
          label="How severe was the pain at its worst?"
          thumbLabel="Worst pain severity"
          lowLabel="0 · No pain"
          highLabel="10 · Worst"
          clearLabel="Clear pain answer"
          value={value.pain_severity}
          disabled={disabled}
          onChange={(pain_severity, save = true) =>
            onChange({ ...value, pain_severity }, save)
          }
        />
      )}
      {status === 'migraine' && (
        <Text size="xs" c="dimmed">
          Symptoms, stress, and notes are stored on this device until Phase A
          server support lands (see issue #51).
        </Text>
      )}
    </Stack>
  )
}
