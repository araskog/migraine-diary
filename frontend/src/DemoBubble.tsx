import { Loader, UnstyledButton } from '@mantine/core'
import type { ReactNode } from 'react'

type DemoBubbleTail = 'login' | 'calendar'

type DemoBubbleButtonProps = {
  tail: DemoBubbleTail
  busy?: boolean
  disabled?: boolean
  children: ReactNode
  onClick: () => void
}

export function DemoBubbleButton({
  tail,
  busy,
  disabled,
  children,
  onClick,
}: DemoBubbleButtonProps) {
  return (
    <UnstyledButton
      className={`demo-bubble demo-bubble--button demo-bubble--${tail}`}
      disabled={disabled || busy}
      aria-busy={busy}
      onClick={onClick}
    >
      {busy ? <Loader size="sm" color="white" /> : children}
    </UnstyledButton>
  )
}

type DemoBubblePanelProps = {
  tail: DemoBubbleTail
  children: ReactNode
  className?: string
}

export function DemoBubblePanel({
  tail,
  children,
  className,
}: DemoBubblePanelProps) {
  return (
    <div
      className={`demo-bubble demo-bubble--panel demo-bubble--${tail}${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  )
}
