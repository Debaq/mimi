import { Link } from 'react-router-dom'
import {
  Users,
  BookOpen,
  FileText,
  Zap,
  ChevronRight,
  Plus,
  BarChart3,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { useSessionsQuery } from '@/hooks/useSessions'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { DashboardStats, ApiResponse } from '@/types'

function useTeacherStats() {
  return useQuery({
    queryKey: ['teacher-stats'],
    queryFn: () => api.get<ApiResponse<DashboardStats>>('/teacher/stats'),
    select: (data) => data.data,
  })
}

export default function TeacherDashboard() {
  const { user } = useAuth()
  const { data: sessions, isLoading: loadingSessions } = useSessionsQuery()
  const { data: stats, isLoading: loadingStats } = useTeacherStats()

  const recentSessions = (sessions ?? []).slice(0, 5)

  const statCards = [
    {
      label: 'Estudiantes',
      value: stats?.total_students ?? 0,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Sesiones Activas',
      value: stats?.active_sessions ?? 0,
      icon: BookOpen,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: 'Protocolos Enviados',
      value: stats?.protocols_submitted ?? 0,
      icon: FileText,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: 'XP Promedio',
      value: stats?.average_xp ?? 0,
      icon: Zap,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Hola, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="mt-1 text-muted">
            Panel de control de tu area docente.
          </p>
        </div>
        <Link to="/teacher/sessions/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nueva Sesion
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-5">
              {loadingStats ? (
                <div className="space-y-3">
                  <div className="h-4 w-24 animate-pulse rounded-lg bg-secondary" />
                  <div className="h-8 w-16 animate-pulse rounded-lg bg-secondary" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg}`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    {stat.label}
                  </div>
                  <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent sessions */}
        <div className="lg:col-span-2">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Sesiones Recientes</CardTitle>
              <Link to="/teacher/sessions">
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
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />
                  ))}
                </div>
              ) : recentSessions.length === 0 ? (
                <div className="py-8 text-center">
                  <BookOpen className="mx-auto h-10 w-10 text-muted/50" />
                  <p className="mt-3 text-sm text-muted">No tienes sesiones creadas aun.</p>
                  <Link to="/teacher/sessions/new" className="mt-3 inline-block">
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4" />
                      Crear Sesion
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map((session) => (
                    <Link
                      key={session.id}
                      to={`/teacher/sessions/${session.id}`}
                      className="flex items-center justify-between rounded-xl border border-border/50 p-4 transition-all hover:bg-secondary/50 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {session.title}
                          </p>
                          <p className="text-xs text-muted">
                            {session.student_count ?? 0} estudiantes &middot;{' '}
                            {session.mode}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          session.status === 'activa'
                            ? 'success'
                            : session.status === 'borrador'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {session.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions + mini analytics */}
        <div className="space-y-6">
          {/* Quick actions */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Acciones Rapidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/teacher/sessions/new" className="block">
                <button className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  Crear nueva sesion
                </button>
              </Link>
              <Link to="/teacher/students" className="block">
                <button className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
                    <Users className="h-4 w-4 text-success" />
                  </div>
                  Ver estudiantes
                </button>
              </Link>
              <Link to="/teacher/library" className="block">
                <button className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
                    <BookOpen className="h-4 w-4 text-warning" />
                  </div>
                  Gestionar recursos
                </button>
              </Link>
            </CardContent>
          </Card>

          {/* Mini chart / stats */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 animate-pulse rounded-lg bg-secondary" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Tasa de envio</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-success" />
                      <span className="text-sm font-semibold text-foreground">
                        {stats?.total_students
                          ? Math.round(
                              ((stats?.protocols_submitted ?? 0) /
                                stats.total_students) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>

                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-success transition-all duration-500"
                      style={{
                        width: `${
                          stats?.total_students
                            ? Math.min(
                                100,
                                Math.round(
                                  ((stats?.protocols_submitted ?? 0) /
                                    stats.total_students) *
                                    100
                                )
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-muted">Sesiones activas</span>
                    <span className="text-sm font-semibold text-foreground">
                      {stats?.active_sessions ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">XP promedio</span>
                    <span className="text-sm font-semibold text-foreground">
                      {stats?.average_xp ?? 0}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
