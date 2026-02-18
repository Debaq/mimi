import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Avatar } from '@/components/ui/Avatar'
import { useSessionQuery, useSessionStudents } from '@/hooks/useSessions'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'
import {
  Calendar,
  Users,
  Settings,
  Trash2,
  Edit,
  Lock,
  Eye,
  FileText,
  Clock,
  ArrowLeft,
} from 'lucide-react'
import type { Protocol, ApiResponse, User } from '@/types'

interface SessionDetailProps {
  sessionId: number
  isTeacher?: boolean
  onBack?: () => void
}

export default function SessionDetail({ sessionId, isTeacher = false, onBack }: SessionDetailProps) {
  const { data: session, isLoading: loadingSession } = useSessionQuery(sessionId)
  const { data: students, isLoading: loadingStudents } = useSessionStudents(
    isTeacher ? sessionId : undefined
  )
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loadingProtocols, setLoadingProtocols] = useState(false)

  useEffect(() => {
    if (isTeacher && sessionId) {
      loadProtocols()
    }
  }, [sessionId, isTeacher])

  async function loadProtocols() {
    setLoadingProtocols(true)
    try {
      const result = await api.get<ApiResponse<Protocol[]>>(
        `/sessions/${sessionId}/protocols`
      )
      setProtocols(result.data)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Error al cargar protocolos')
    } finally {
      setLoadingProtocols(false)
    }
  }

  if (loadingSession) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-muted">No se encontro la sesion.</p>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Volver
          </Button>
        )}
      </div>
    )
  }

  const statusVariant: Record<string, 'default' | 'success' | 'secondary'> = {
    activa: 'success',
    borrador: 'secondary',
    cerrada: 'secondary',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="size-4" />
              Volver a sesiones
            </button>
          )}
          <h1 className="text-2xl font-bold text-foreground">{session.title}</h1>
          <p className="text-muted">{session.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={statusVariant[session.status] || 'secondary'}>
              {session.status}
            </Badge>
            <Badge variant="secondary">{session.mode}</Badge>
            <Badge variant="outline">{session.difficulty}</Badge>
          </div>
        </div>

        {/* Acciones del docente */}
        {isTeacher && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Edit className="size-3.5" />
              Editar
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Lock className="size-3.5" />
              Cerrar
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
              <Trash2 className="size-3.5" />
              Eliminar
            </Button>
          </div>
        )}
      </div>

      {/* Informacion de la sesion */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Calendar className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted">Periodo</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(session.start_date).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                  })}{' '}
                  -{' '}
                  {new Date(session.end_date).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-success/10">
                <Users className="size-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted">Estudiantes</p>
                <p className="text-sm font-medium text-foreground">
                  {session.student_count || students?.length || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-warning/10">
                <Settings className="size-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted">Configuracion</p>
                <p className="text-sm font-medium text-foreground">
                  {session.allow_retries ? 'Reintentos' : 'Sin reintentos'}
                  {session.show_hints ? ' / Pistas' : ''}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planteamiento del problema */}
      {session.problem_statement && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Planteamiento del problema</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {session.problem_statement}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Estudiantes (solo docente) */}
      {isTeacher && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4" />
              Estudiantes ({students?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStudents ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : !students?.length ? (
              <p className="text-sm text-muted text-center py-6">
                Aun no hay estudiantes en esta sesion.
              </p>
            ) : (
              <div className="space-y-2">
                {students.map((student: User) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between rounded-lg p-3 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={student.avatar_url} alt={student.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{student.name}</p>
                        <p className="text-xs text-muted">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">
                        Nv. {student.level}
                      </Badge>
                      <span className="text-xs text-muted">{student.xp} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Protocolos (solo docente) */}
      {isTeacher && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="size-4" />
              Protocolos enviados ({protocols.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProtocols ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : protocols.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">
                No hay protocolos enviados aun.
              </p>
            ) : (
              <div className="space-y-2">
                {protocols.map((protocol) => (
                  <div
                    key={protocol.id}
                    className="flex items-center justify-between rounded-lg p-3 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-secondary">
                        <FileText className="size-4 text-muted" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Protocolo #{protocol.id}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted">Paso {protocol.current_step}/7</span>
                          {protocol.submitted_at && (
                            <span className="text-xs text-muted flex items-center gap-1">
                              <Clock className="size-3" />
                              {new Date(protocol.submitted_at).toLocaleDateString('es-ES')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          protocol.status === 'aprobado'
                            ? 'success'
                            : protocol.status === 'enviado'
                              ? 'default'
                              : protocol.status === 'rechazado'
                                ? 'destructive'
                                : 'secondary'
                        }
                        className="text-xs"
                      >
                        {protocol.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
