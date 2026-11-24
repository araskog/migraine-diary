import type { ReactNode } from 'react'

type DemoBubbleProps = {
  tail: 'login' | 'calendar'
  children: ReactNode
  className?: string
}

export default function DemoBubble({
  tail,
  children,
  className,
}: DemoBubbleProps) {
  return (
    <div
      className={`demo-speech-bubble demo-speech-bubble--${tail}${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  )
}
