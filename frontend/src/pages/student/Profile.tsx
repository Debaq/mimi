import {
  User,
  Mail,
  Star,
  Zap,
  Trophy,
  Calendar,
  Clock,
  Shield,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { useProgressQuery, useActivityQuery, useBadgesQuery } from '@/hooks/useProgress'

export default function Profile() {
  const { user } = useAuth()
  const { data: progress, isLoading: loadingProgress } = useProgressQuery()
  const { data: activity, isLoading: loadingActivity } = useActivityQuery()
  const { data: allBadges, isLoading: loadingBadges } = useBadgesQuery()

  const xpPercent = progress
    ? Math.min(100, Math.round((progress.xp / progress.next_level_xp) * 100))
    : 0

  const earnedBadges = progress?.badges ?? []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Mi Perfil</h1>
        <p className="mt-1 text-muted">Tu informacion y progreso en MIMI.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User info card */}
        <div className="lg:col-span-1">
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>

                <h2 className="mt-4 text-lg font-semibold text-foreground">{user?.name}</h2>

                <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <Mail className="h-3.5 w-3.5" />
                  {user?.email}
                </div>

                <Badge variant="outline" className="mt-3">
                  <User className="mr-1 h-3 w-3" />
                  Estudiante
                </Badge>

                {user?.created_at && (
                  <p className="mt-4 text-xs text-muted flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Miembro desde{' '}
                    {new Date(user.created_at).toLocaleDateString('es-MX', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Level and XP */}
        <div className="lg:col-span-2 space-y-6">
          {/* XP card */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-warning" />
                Nivel y Experiencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProgress ? (
                <div className="space-y-4">
                  <div className="h-12 animate-pulse rounded-xl bg-secondary" />
                  <div className="h-4 animate-pulse rounded-lg bg-secondary" />
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-5xl font-bold text-foreground">
                      {progress?.level ?? 1}
                    </span>
                    <span className="text-lg text-muted">Nivel</span>
                  </div>

                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-muted">
                      <Zap className="mr-1 inline h-4 w-4 text-warning" />
                      {progress?.xp ?? 0} XP
                    </span>
                    <span className="text-muted">{progress?.next_level_xp ?? 100} XP</span>
                  </div>
                  <div className="h-3 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {(progress?.next_level_xp ?? 100) - (progress?.xp ?? 0)} XP restantes para
                    el siguiente nivel
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Badges */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-success" />
                Coleccion de Insignias
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBadges || loadingProgress ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />
                  ))}
                </div>
              ) : earnedBadges.length === 0 ? (
                <div className="py-8 text-center">
                  <Shield className="mx-auto h-10 w-10 text-muted/40" />
                  <p className="mt-3 text-sm text-muted">
                    Aun no has ganado insignias. Completa sesiones para desbloquearlas!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {earnedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex flex-col items-center gap-2 rounded-xl border border-border/50 p-3 text-center hover:bg-secondary/50 transition-colors"
                      title={badge.description}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-lg">
                        {badge.icon || '🏆'}
                      </div>
                      <span className="text-xs font-medium text-foreground line-clamp-2">
                        {badge.name}
                      </span>
                    </div>
                  ))}

                  {/* Locked badges placeholder */}
                  {allBadges
                    ?.filter((b) => !earnedBadges.find((e) => e.id === b.id))
                    .slice(0, 5)
                    .map((badge) => (
                      <div
                        key={badge.id}
                        className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/50 p-3 text-center opacity-40"
                        title={`Bloqueada: ${badge.description}`}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-lg">
                          ?
                        </div>
                        <span className="text-xs font-medium text-muted line-clamp-2">
                          {badge.name}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity history */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            Historial de Actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingActivity ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-secondary" />
                    <div className="h-2 w-24 animate-pulse rounded bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : !activity || activity.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="mx-auto h-10 w-10 text-muted/40" />
              <p className="mt-3 text-sm text-muted">Sin actividad registrada aun.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activity.map((log) => (
                <div key={log.id} className="flex items-start gap-3 pb-4 border-b border-border/30 last:border-0 last:pb-0">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{log.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {log.xp_earned > 0 && (
                        <span className="text-xs font-medium text-success">
                          +{log.xp_earned} XP
                        </span>
                      )}
                      <span className="text-xs text-muted">
                        {new Date(log.created_at).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
