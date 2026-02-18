import { useAuth } from '@/hooks/useAuth'
import { useSessionsQuery } from '@/hooks/useSessions'
import { useProgressQuery, useActivityQuery } from '@/hooks/useProgress'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import StatsCard from './StatsCard'
import {
  Star,
  Zap,
  BookOpen,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  Play,
} from 'lucide-react'
import type { Session, ActivityLog } from '@/types'

export default function StudentDashboard() {
  const { user } = useAuth()
  const { data: sessions, isLoading: loadingSessions } = useSessionsQuery()
  const { data: progress, isLoading: loadingProgress } = useProgressQuery()
  const { data: activity, isLoading: loadingActivity } = useActivityQuery()

  const activeSessions = sessions?.filter((s: Session) => s.status === 'activa') || []

  const levelNames: Record<number, string> = {
    1: 'Aprendiz',
    2: 'Junior',
    3: 'Asociado',
    4: 'Senior',
    5: 'Maestro',
  }

  const isLoading = loadingSessions || loadingProgress

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Saludo */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Hola, {user?.name?.split(' ')[0] || 'Estudiante'}
        </h1>
        <p className="text-muted mt-1">
          Continua construyendo tu protocolo de investigacion.
        </p>
      </div>

      {/* Estadisticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Nivel"
          value={levelNames[progress?.level || 1] || 'Aprendiz'}
          subtitle={`Nivel ${progress?.level || 1}`}
          icon={Star}
        />
        <StatsCard
          title="Experiencia"
          value={`${progress?.xp || 0} XP`}
          subtitle={`${progress?.next_level_xp || 100} XP para siguiente nivel`}
          icon={Zap}
        />
        <StatsCard
          title="Sesiones Activas"
          value={activeSessions.length}
          subtitle="En progreso"
          icon={BookOpen}
        />
        <StatsCard
          title="Insignias"
          value={progress?.badges?.length || 0}
          subtitle="Obtenidas"
          icon={Sparkles}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sesiones activas */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Sesiones activas</h2>
          {activeSessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                <BookOpen className="size-10 text-muted" />
                <p className="text-muted text-sm">No tienes sesiones activas.</p>
                <Button variant="outline" size="sm">
                  Unirte a una sesion
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeSessions.slice(0, 3).map((session: Session) => (
                <Card key={session.id} className="transition-all hover:shadow-md">
                  <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-4">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                        <FileText className="size-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{session.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-xs">
                            {session.mode}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {session.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      Continuar
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Actividad reciente */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Actividad reciente</h2>
          <Card>
            <CardContent className="pt-6">
              {loadingActivity ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : !activity?.length ? (
                <p className="text-sm text-muted text-center py-6">
                  Sin actividad reciente.
                </p>
              ) : (
                <div className="space-y-4">
                  {activity.slice(0, 5).map((item: ActivityLog) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                        <Clock className="size-3.5 text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{item.action}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.xp_earned > 0 && (
                            <span className="text-xs font-medium text-success">
                              +{item.xp_earned} XP
                            </span>
                          )}
                          <span className="text-xs text-muted">
                            {new Date(item.created_at).toLocaleDateString('es-ES', {
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

          {/* Quick start */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Play className="size-4 text-primary" />
                Inicio rapido
              </CardTitle>
              <CardDescription>
                Comienza una nueva sesion o continua donde te quedaste.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full gap-2">
                <Zap className="size-4" />
                Continuar ultimo protocolo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
