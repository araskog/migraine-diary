import { Center, Loader, VisuallyHidden } from '@mantine/core'

type LoadingIndicatorProps = {
  label?: string
  fullPage?: boolean
}

export default function LoadingIndicator({
  label = 'Loading',
  fullPage = false,
}: LoadingIndicatorProps) {
  return (
    <Center className={fullPage ? 'page-loading' : undefined} role="status">
      <Loader size="sm" aria-hidden="true" />
      <VisuallyHidden>{label}</VisuallyHidden>
    </Center>
  )
}
