import { Progress } from '@/components/ui/Progress'
import { Zap } from 'lucide-react'
import LevelBadge from './LevelBadge'

interface XPBarProps {
  currentXP: number
  nextLevelXP: number
  level?: number
  className?: string
}

export default function XPBar({ currentXP, nextLevelXP, level, className = '' }: XPBarProps) {

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {level && <LevelBadge level={level} size="sm" />}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted">
          <Zap className="size-3.5 text-warning" />
          <span className="font-medium text-foreground">{currentXP}</span>
          <span>/ {nextLevelXP} XP</span>
        </div>
      </div>
      <Progress
        value={currentXP}
        max={nextLevelXP}
        color="primary"
        height="default"
      />
      <p className="text-xs text-muted text-right">
        {Math.max(0, nextLevelXP - currentXP)} XP restantes para el siguiente nivel
      </p>
    </div>
  )
}
