// frontend/src/components/ui/logo.tsx
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

const sizeMap = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-14 h-14',
}

const textSizeMap = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-3xl',
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img
        src="/logo-icon.svg"
        alt="Beergate"
        className={cn(sizeMap[size], 'shrink-0')}
      />
      {showText && (
        <span className={cn('font-semibold amber-text whitespace-nowrap', textSizeMap[size])}>
          Beergate
        </span>
      )}
    </div>
  )
}
