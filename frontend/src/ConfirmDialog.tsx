import { Button, Group, Modal, Text } from '@mantine/core'

type ConfirmDialogProps = {
  opened: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmDialog({
  opened,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal opened={opened} onClose={onClose} title={title} centered>
      <Text size="sm">{message}</Text>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>
          Keep editing
        </Button>
        <Button onClick={onConfirm}>{confirmLabel}</Button>
      </Group>
    </Modal>
  )
}
