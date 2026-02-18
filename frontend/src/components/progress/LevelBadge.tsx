import { Star, Award, Trophy, Crown, Gem } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LevelBadgeProps {
  level: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const LEVEL_CONFIG: Record<
  number,
  { name: string; icon: React.ElementType; bg: string; text: string }
> = {
  1: { name: 'Aprendiz', icon: Star, bg: 'bg-secondary', text: 'text-foreground' },
  2: { name: 'Junior', icon: Award, bg: 'bg-primary/10', text: 'text-primary' },
  3: { name: 'Asociado', icon: Trophy, bg: 'bg-warning/10', text: 'text-warning' },
  4: { name: 'Senior', icon: Crown, bg: 'bg-success/10', text: 'text-success' },
  5: { name: 'Maestro', icon: Gem, bg: 'bg-accent/10', text: 'text-accent' },
}

const SIZE_CONFIG = {
  sm: {
    container: 'gap-1.5 px-2.5 py-1 text-xs',
    icon: 'size-3.5',
  },
  md: {
    container: 'gap-2 px-3 py-1.5 text-sm',
    icon: 'size-4',
  },
  lg: {
    container: 'gap-2.5 px-4 py-2 text-base',
    icon: 'size-5',
  },
}

export default function LevelBadge({ level, size = 'md', className }: LevelBadgeProps) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1]
  const sizeConfig = SIZE_CONFIG[size]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-all',
        config.bg,
        config.text,
        sizeConfig.container,
        className
      )}
    >
      <Icon className={sizeConfig.icon} />
      <span>Nv. {level}</span>
      <span className="hidden sm:inline">- {config.name}</span>
    </div>
  )
}
