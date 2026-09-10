import { cn } from '../lib/ui'

interface BrandMarkProps {
  className?: string
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <img
      src="/pharmat-mark.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      className={cn('shrink-0 object-contain', className)}
    />
  )
}
