import { Tooltip } from '@/components/ui/Tooltip'
import {
  Star,
  Award,
  Trophy,
  Target,
  Zap,
  BookOpen,
  Shield,
  Lightbulb,
  Rocket,
  Heart,
  Gem,
  Crown,
} from 'lucide-react'
import type { Badge as BadgeType } from '@/types'

interface BadgeGridProps {
  badges: BadgeType[]
  earnedBadges: number[]
  className?: string
}

// Mapeo de iconos de badges
const BADGE_ICONS: Record<string, React.ElementType> = {
  star: Star,
  award: Award,
  trophy: Trophy,
  target: Target,
  zap: Zap,
  book: BookOpen,
  shield: Shield,
  lightbulb: Lightbulb,
  rocket: Rocket,
  heart: Heart,
  gem: Gem,
  crown: Crown,
}

export default function BadgeGrid({ badges, earnedBadges, className = '' }: BadgeGridProps) {
  const earnedSet = new Set(earnedBadges)

  return (
    <div className={`grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 ${className}`}>
      {badges.map((badge) => {
        const isEarned = earnedSet.has(badge.id)
        const Icon = BADGE_ICONS[badge.icon] || Star

        return (
          <Tooltip
            key={badge.id}
            content={
              <div className="text-center">
                <p className="font-medium">{badge.name}</p>
                <p className="text-xs opacity-80">{badge.description}</p>
                {isEarned && badge.earned_at && (
                  <p className="text-xs opacity-60 mt-1">
                    Obtenida: {new Date(badge.earned_at).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>
            }
            position="top"
          >
            <button
              type="button"
              className={`flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all duration-200 ${
                isEarned
                  ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-sm'
                  : 'bg-secondary/50 text-muted/40 hover:bg-secondary'
              }`}
            >
              <div
                className={`flex size-10 items-center justify-center rounded-full ${
                  isEarned ? 'bg-primary/20' : 'bg-secondary'
                }`}
              >
                <Icon className={`size-5 ${isEarned ? 'text-primary' : 'text-muted/30'}`} />
              </div>
              <span
                className={`text-[10px] font-medium leading-tight text-center line-clamp-2 ${
                  isEarned ? 'text-foreground' : 'text-muted/50'
                }`}
              >
                {badge.name}
              </span>
            </button>
          </Tooltip>
        )
      })}
    </div>
  )
}
