import {
  Anchor,
  Box,
  Group,
  Radio,
  Select,
  Slider,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import type { DiaryDetails, DiaryStatus } from './diary'

type DiaryDetailsFieldsProps = {
  status: DiaryStatus
  value: DiaryDetails
  disabled: boolean
  onChange: (value: DiaryDetails) => void
}

export default function DiaryDetailsFields({
  status,
  value,
  disabled,
  onChange,
}: DiaryDetailsFieldsProps) {
  return (
    <Stack gap="xl">
      <Stack gap="xs">
        <Radio.Group
          label="Did you take migraine medication?"
          value={
            value.medication_taken === null
              ? ''
              : value.medication_taken
                ? 'yes'
                : 'no'
          }
          onChange={(answer) =>
            onChange({
              ...value,
              medication_taken: answer === 'yes',
              medication_name: answer === 'yes' ? value.medication_name : '',
            })
          }
        >
          <Group mt="xs" gap="xl">
            <Radio value="yes" label="Yes" disabled={disabled} />
            <Radio value="no" label="No" disabled={disabled} />
          </Group>
        </Radio.Group>
        {value.medication_taken !== null && (
          <Anchor
            component="button"
            ta="left"
            style={{ alignSelf: 'flex-start' }}
            type="button"
            size="xs"
            c="dimmed"
            disabled={disabled}
            onClick={() =>
              onChange({
                ...value,
                medication_taken: null,
                medication_name: '',
              })
            }
          >
            Clear medication answer
          </Anchor>
        )}
        {value.medication_taken === true && (
          <TextInput
            label="Which medication?"
            placeholder="Medication name"
            maxLength={200}
            value={value.medication_name}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...value, medication_name: event.currentTarget.value })
            }
          />
        )}
      </Stack>
      <Select
        label="How was your sleep last night?"
        placeholder="Choose if you like"
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
      {status === 'migraine' && (
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            How severe was the pain at its worst?
          </Text>
          <Text size="sm" c="dimmed">
            {value.pain_severity === null
              ? 'Not answered'
              : `${value.pain_severity} out of 10`}
          </Text>
          <Box px="xs" pb="lg">
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
              marks={[
                { value: 0, label: '0 · No pain' },
                { value: 10, label: '10 · Worst' },
              ]}
              disabled={disabled}
              onChange={(pain_severity) =>
                onChange({ ...value, pain_severity })
              }
            />
          </Box>
          {value.pain_severity !== null && (
            <Anchor
              component="button"
              ta="left"
              style={{ alignSelf: 'flex-start' }}
              type="button"
              size="xs"
              c="dimmed"
              disabled={disabled}
              onClick={() => onChange({ ...value, pain_severity: null })}
            >
              Clear pain answer
            </Anchor>
          )}
        </Stack>
      )}
    </Stack>
  )
}
