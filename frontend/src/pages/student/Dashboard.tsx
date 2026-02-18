import { Link } from 'react-router-dom'
import {
  BookOpen,
  ChevronRight,
  Trophy,
  Zap,
  Clock,
  Play,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { useSessionsQuery } from '@/hooks/useSessions'
import { useProgressQuery, useActivityQuery } from '@/hooks/useProgress'

export default function StudentDashboard() {
  const { user } = useAuth()
  const { data: sessions, isLoading: loadingSessions } = useSessionsQuery()
  const { data: progress, isLoading: loadingProgress } = useProgressQuery()
  const { data: activity, isLoading: loadingActivity } = useActivityQuery()

  const activeSessions = sessions?.filter((s) => s.status === 'activa') ?? []
  const xpPercent = progress
    ? Math.min(100, Math.round((progress.xp / progress.next_level_xp) * 100))
    : 0

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Hola, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="mt-1 text-muted">
          Bienvenido de vuelta a tu espacio de investigacion.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Level / XP card */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            {loadingProgress ? (
              <div className="space-y-3">
                <div className="h-4 w-20 animate-pulse rounded-lg bg-secondary" />
                <div className="h-8 w-16 animate-pulse rounded-lg bg-secondary" />
                <div className="h-2 animate-pulse rounded-full bg-secondary" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Star className="h-4 w-4 text-warning" />
                  Nivel
                </div>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {progress?.level ?? 1}
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted mb-1">
                    <span>{progress?.xp ?? 0} XP</span>
                    <span>{progress?.next_level_xp ?? 100} XP</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sessions count */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            {loadingSessions ? (
              <div className="space-y-3">
                <div className="h-4 w-24 animate-pulse rounded-lg bg-secondary" />
                <div className="h-8 w-12 animate-pulse rounded-lg bg-secondary" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Sesiones Activas
                </div>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {activeSessions.length}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Badges */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            {loadingProgress ? (
              <div className="space-y-3">
                <div className="h-4 w-20 animate-pulse rounded-lg bg-secondary" />
                <div className="h-8 w-12 animate-pulse rounded-lg bg-secondary" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Trophy className="h-4 w-4 text-success" />
                  Insignias
                </div>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {progress?.badges?.length ?? 0}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* XP total */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            {loadingProgress ? (
              <div className="space-y-3">
                <div className="h-4 w-20 animate-pulse rounded-lg bg-secondary" />
                <div className="h-8 w-16 animate-pulse rounded-lg bg-secondary" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Zap className="h-4 w-4 text-warning" />
                  XP Total
                </div>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {progress?.xp ?? 0}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active sessions */}
        <div className="lg:col-span-2">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Sesiones Activas</CardTitle>
              <Link to="/sessions">
                <Button variant="ghost" size="sm">
                  Ver todas
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loadingSessions ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />
                  ))}
                </div>
              ) : activeSessions.length === 0 ? (
                <div className="py-8 text-center">
                  <BookOpen className="mx-auto h-10 w-10 text-muted/50" />
                  <p className="mt-3 text-sm text-muted">No tienes sesiones activas.</p>
                  <Link to="/sessions" className="mt-3 inline-block">
                    <Button variant="outline" size="sm">
                      Explorar Sesiones
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeSessions.slice(0, 4).map((session) => (
                    <Link
                      key={session.id}
                      to={`/constructor/${session.id}`}
                      className="flex items-center justify-between rounded-xl border border-border/50 p-4 transition-all hover:bg-secondary/50 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <Play className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {session.title}
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            {session.mode === 'constructor'
                              ? 'Constructor'
                              : session.mode === 'detective'
                                ? 'Detective'
                                : 'Laboratorio'}{' '}
                            &middot; {session.difficulty}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="hidden sm:inline-flex">
                        {session.mode}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent activity */}
        <div>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingActivity ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-full animate-pulse rounded bg-secondary" />
                        <div className="h-2 w-20 animate-pulse rounded bg-secondary" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !activity || activity.length === 0 ? (
                <div className="py-6 text-center">
                  <Clock className="mx-auto h-8 w-8 text-muted/50" />
                  <p className="mt-2 text-sm text-muted">Sin actividad reciente.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activity.slice(0, 6).map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground truncate">{log.action}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {log.xp_earned > 0 && (
                            <span className="text-xs font-medium text-success">
                              +{log.xp_earned} XP
                            </span>
                          )}
                          <span className="text-xs text-muted">
                            {new Date(log.created_at).toLocaleDateString('es-MX', {
                              day: 'numeric',
                              month: 'short',
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
      </div>

      {/* Quick actions */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Acciones Rapidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link to="/sessions">
              <Button variant="outline">
                <BookOpen className="h-4 w-4" />
                Unirse a Sesion
              </Button>
            </Link>
            {activeSessions.length > 0 && (
              <Link to={`/constructor/${activeSessions[0].id}`}>
                <Button variant="outline">
                  <Play className="h-4 w-4" />
                  Continuar Protocolo
                </Button>
              </Link>
            )}
            <Link to="/resources">
              <Button variant="outline">
                <BookOpen className="h-4 w-4" />
                Ver Recursos
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
