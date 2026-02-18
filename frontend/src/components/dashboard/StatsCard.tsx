import { Card, CardContent } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
}

export default function StatsCard({ title, value, subtitle, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted">{title}</p>
            <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
          </div>
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="size-6 text-primary" />
          </div>
        </div>

        {trend && (
          <div className="mt-3 flex items-center gap-1.5">
            {trend.direction === 'up' ? (
              <TrendingUp className="size-4 text-success" />
            ) : (
              <TrendingDown className="size-4 text-destructive" />
            )}
            <span
              className={`text-xs font-medium ${
                trend.direction === 'up' ? 'text-success' : 'text-destructive'
              }`}
            >
              {trend.direction === 'up' ? '+' : '-'}{Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted">vs. semana pasada</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
