import { useAuth } from '@/hooks/useAuth'
import { useSessionsQuery } from '@/hooks/useSessions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import StatsCard from './StatsCard'
import { api } from '@/lib/api'
import { useState, useEffect } from 'react'
import {
  Users,
  BookOpen,
  FileText,
  BarChart3,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  Settings,
} from 'lucide-react'
import type { Session, DashboardStats, ApiResponse, Protocol } from '@/types'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const { data: sessions, isLoading: loadingSessions } = useSessionsQuery()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentProtocols, setRecentProtocols] = useState<Protocol[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    setLoadingStats(true)
    try {
      const [statsRes, protocolsRes] = await Promise.all([
        api.get<ApiResponse<DashboardStats>>('/dashboard/stats'),
        api.get<ApiResponse<Protocol[]>>('/dashboard/recent-protocols'),
      ])
      setStats(statsRes.data)
      setRecentProtocols(protocolsRes.data)
    } catch {
      // Error silencioso
    } finally {
      setLoadingStats(false)
    }
  }

  const activeSessions = sessions?.filter((s: Session) => s.status === 'activa') || []
  const isLoading = loadingSessions || loadingStats

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Hola, {user?.name?.split(' ')[0] || 'Docente'}
          </h1>
          <p className="text-muted mt-1">Panel de administracion de sesiones y estudiantes.</p>
        </div>
        <Button className="gap-2">
          <Plus className="size-4" />
          Nueva sesion
        </Button>
      </div>

      {/* Estadisticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Estudiantes"
          value={stats?.total_students || 0}
          subtitle="Registrados"
          icon={Users}
          trend={{ value: 12, direction: 'up' }}
        />
        <StatsCard
          title="Sesiones Activas"
          value={stats?.active_sessions || 0}
          subtitle="En curso"
          icon={BookOpen}
        />
        <StatsCard
          title="Protocolos Enviados"
          value={stats?.protocols_submitted || 0}
          subtitle="Para revision"
          icon={FileText}
          trend={{ value: 8, direction: 'up' }}
        />
        <StatsCard
          title="XP Promedio"
          value={stats?.average_xp || 0}
          subtitle="Por estudiante"
          icon={BarChart3}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Protocolos pendientes de revision */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Protocolos pendientes de revision</h2>
          {recentProtocols.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                <CheckCircle className="size-10 text-success" />
                <p className="text-muted text-sm">No hay protocolos pendientes de revision.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentProtocols.slice(0, 5).map((protocol) => (
                <Card key={protocol.id} className="transition-all hover:shadow-md">
                  <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-4">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-warning/10">
                        <FileText className="size-5 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          Protocolo #{protocol.id}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant={
                              protocol.status === 'enviado'
                                ? 'default'
                                : protocol.status === 'aprobado'
                                  ? 'success'
                                  : 'secondary'
                            }
                            className="text-xs"
                          >
                            {protocol.status}
                          </Badge>
                          <span className="text-xs text-muted">
                            Paso {protocol.current_step}/7
                          </span>
                          {protocol.submitted_at && (
                            <span className="text-xs text-muted flex items-center gap-1">
                              <Clock className="size-3" />
                              {new Date(protocol.submitted_at).toLocaleDateString('es-ES')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <Eye className="size-3.5" />
                      Revisar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div className="space-y-4">
          {/* Sesiones del docente */}
          <h2 className="text-lg font-semibold text-foreground">Mis sesiones</h2>
          <Card>
            <CardContent className="pt-6">
              {activeSessions.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">
                  No tienes sesiones activas.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeSessions.slice(0, 4).map((session: Session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-lg p-3 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {session.title}
                        </p>
                        <p className="text-xs text-muted">
                          {session.student_count || 0} estudiantes
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0 ml-2">
                        {session.mode}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones rapidas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Acciones rapidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <Plus className="size-4" />
                  Crear sesion
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <Users className="size-4" />
                  Ver estudiantes
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <BarChart3 className="size-4" />
                  Reportes
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <Settings className="size-4" />
                  Configuracion
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
