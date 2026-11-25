import { useState } from 'react'
import {
  Anchor,
  Button,
  Collapse,
  Group,
  Checkbox,
  Input,
  Select,
  Slider,
  Stack,
  Text,
  Textarea,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react'
import type { DiaryDetails, DiaryStatus } from './diary'
import SymptomChipGroups from './SymptomChipGroups'
import './SymptomChipGroups.css'

type DiaryDetailsFieldsProps = {
  status: DiaryStatus
  value: DiaryDetails
  disabled: boolean
  onChange: (value: DiaryDetails, save?: boolean) => void
}

function PainSeveritySlider({
  value,
  disabled,
  onChange,
}: {
  value: number | null
  disabled: boolean
  onChange: (pain_severity: number | null, save?: boolean) => void
}) {
  return (
    <Input.Wrapper
      label="How severe was the pain at its worst?"
      description={value === null ? 'Not answered' : `${value} out of 10`}
    >
      <Stack gap="xs" mt="xs">
        <Slider
          min={0}
          max={10}
          step={1}
          value={value ?? 0}
          color={value === null ? 'gray' : 'sage'}
          thumbLabel="Worst pain severity"
          thumbValueText={
            value === null ? 'Not answered' : `${value} out of 10`
          }
          marks={[{ value: 0 }, { value: 10 }]}
          disabled={disabled}
          onChangeEnd={(pain_severity) => onChange(pain_severity)}
          onChange={(pain_severity) => onChange(pain_severity, false)}
        />
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Input.Description>0 · No pain</Input.Description>
          <Input.Description>10 · Worst</Input.Description>
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
            Clear pain answer
          </Anchor>
        )}
      </Stack>
    </Input.Wrapper>
  )
}

function SymptomsSection({
  value,
  disabled,
  onChange,
}: {
  value: DiaryDetails
  disabled: boolean
  onChange: (value: DiaryDetails, save?: boolean) => void
}) {
  const [opened, setOpened] = useState(() => value.symptoms.length > 0)
  const selectedCount = value.symptoms.length
  const summary =
    selectedCount === 0
      ? 'None selected'
      : selectedCount === 1
        ? '1 selected'
        : `${selectedCount} selected`

  return (
    <Stack gap={0}>
      <UnstyledButton
        type="button"
        aria-expanded={opened}
        aria-controls="symptoms-panel"
        disabled={disabled}
        className="symptoms-foldout-trigger"
        onClick={() => setOpened((current) => !current)}
      >
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Group gap="xs" wrap="nowrap">
            {opened ? (
              <IconChevronDown size={16} stroke={2} aria-hidden />
            ) : (
              <IconChevronRight size={16} stroke={2} aria-hidden />
            )}
            <Text size="sm" fw={500} id="symptoms-label">
              Symptoms
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            {summary}
          </Text>
        </Group>
      </UnstyledButton>
      <Collapse expanded={opened} id="symptoms-panel">
        <Stack gap="sm" pt="sm">
          <SymptomChipGroups
            value={value.symptoms}
            disabled={disabled}
            onChange={(symptoms, save) =>
              onChange({ ...value, symptoms }, save)
            }
          />
        </Stack>
      </Collapse>
    </Stack>
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
        <PainSeveritySlider
          value={value.pain_severity}
          disabled={disabled}
          onChange={(pain_severity, save = true) =>
            onChange({ ...value, pain_severity }, save)
          }
        />
      )}
      {status === 'migraine' && (
        <SymptomsSection
          value={value}
          disabled={disabled}
          onChange={onChange}
        />
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
        <Stack gap="xs">
          {!noteVisible ? (
            <Button
              variant="default"
              size="compact-sm"
              radius="sm"
              fullWidth
              disabled={disabled}
              onClick={() => setNoteOpen(true)}
            >
              Add a personal note
            </Button>
          ) : (
            <Textarea
              label="Personal note"
              placeholder="Anything you want to remember about today"
              autosize
              minRows={3}
              maxLength={2000}
              radius="sm"
              value={value.personal_note}
              disabled={disabled}
              onBlur={(event) =>
                onChange({
                  ...value,
                  personal_note: event.currentTarget.value,
                })
              }
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
      )}
    </Stack>
  )
}
