import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  FileText,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Play,
  Loader2,
  Pencil,
  X,
  Check,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useSessionQuery, useSessionStudents, useUpdateSession, useDeleteSession } from '@/hooks/useSessions'
import { toast } from '@/components/ui/Toast'

interface StudentRow {
  id: number
  name: string
  email: string
  level: number
  xp: number
  avatar_url: string | null
  enrollment_status: string
  joined_at: string
  protocol_id: number | null
  protocol_status: string | null
  protocol_step: number | null
}

function getProtocolBadge(status: string | null, step: number | null) {
  switch (status) {
    case 'aprobado':
      return <Badge variant="success">Aprobado</Badge>
    case 'rechazado':
      return <Badge variant="destructive">Rechazado</Badge>
    case 'enviado':
      return <Badge variant="default">Enviado</Badge>
    case 'en_progreso':
      return <Badge variant="secondary">Paso {step ?? '?'} de 7</Badge>
    default:
      return <Badge variant="outline">Sin iniciar</Badge>
  }
}

const modeLabels: Record<string, string> = {
  constructor: 'Constructor',
  detective: 'Detective',
  laboratorio: 'Laboratorio',
}

const modeRoutes: Record<string, string> = {
  constructor: '/teacher/constructor',
  detective: '/detective',
  laboratorio: '/laboratory',
}

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const sessionId = id ? Number(id) : undefined
  const { data: session, isLoading: loadingSession } = useSessionQuery(sessionId)
  const { data: students, isLoading: loadingStudents } = useSessionStudents(sessionId)
  const updateSession = useUpdateSession()
  const deleteSession = useDeleteSession()

  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editProblem, setEditProblem] = useState('')

  function startEditing() {
    if (!session) return
    setEditTitle(session.title)
    setEditDescription(session.description || '')
    setEditProblem(session.problem_statement || '')
    setEditing(true)
  }

  async function saveEdits() {
    if (!session) return
    try {
      await updateSession.mutateAsync({
        id: session.id,
        title: editTitle.trim(),
        description: editDescription.trim(),
        problem_statement: editProblem.trim(),
      })
      setEditing(false)
      toast('success', 'Sesion actualizada')
    } catch {
      toast('error', 'Error al actualizar la sesion')
    }
  }

  async function changeStatus(newStatus: 'activa' | 'borrador' | 'cerrada') {
    if (!session) return
    try {
      await updateSession.mutateAsync({ id: session.id, status: newStatus })
      toast(
        'success',
        newStatus === 'activa'
          ? 'Sesion publicada'
          : newStatus === 'cerrada'
            ? 'Sesion cerrada'
            : 'Sesion movida a borrador'
      )
    } catch {
      toast('error', 'Error al cambiar el estado')
    }
  }

  async function handleDelete() {
    if (!session) return
    if (!confirm(`Eliminar la sesion "${session.title}"? Esta accion no se puede deshacer.`)) return
    try {
      await deleteSession.mutateAsync(session.id)
      toast('success', 'Sesion eliminada')
      navigate('/teacher/sessions')
    } catch {
      toast('error', 'Error al eliminar la sesion')
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'activa':
        return <Badge variant="success">Activa</Badge>
      case 'borrador':
        return <Badge variant="secondary">Borrador</Badge>
      case 'cerrada':
        return <Badge variant="outline">Cerrada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loadingSession) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-32 animate-pulse rounded-lg bg-secondary" />
        <div className="h-10 w-96 animate-pulse rounded-xl bg-secondary" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-secondary" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted/50" />
        <h2 className="mt-4 text-lg font-medium text-foreground">Sesion no encontrada</h2>
        <Link to="/teacher/sessions" className="mt-4 inline-block">
          <Button variant="outline">Volver a sesiones</Button>
        </Link>
      </div>
    )
  }

  const totalStudents = students?.length ?? 0
  const stats = (session as any).protocol_stats as Record<string, number> | undefined
  const protocolsEnviados = (stats?.enviado ?? 0) + (stats?.aprobado ?? 0) + (stats?.rechazado ?? 0)
  const totalProtocols = protocolsEnviados + (stats?.en_progreso ?? 0)
  const completionRate = totalStudents > 0
    ? Math.round((protocolsEnviados / totalStudents) * 100)
    : 0

  const testRoute = modeRoutes[session.mode]

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        to="/teacher/sessions"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a sesiones
      </Link>

      {/* Session header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            {editing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-2xl font-bold w-full max-w-lg"
              />
            ) : (
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                {session.title}
              </h1>
            )}
            {getStatusBadge(session.status)}
          </div>
          {editing ? (
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Descripcion de la sesion..."
              className="mt-2 max-w-2xl"
              rows={2}
            />
          ) : (
            session.description && (
              <p className="mt-2 text-muted max-w-2xl">{session.description}</p>
            )
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className="capitalize">{modeLabels[session.mode] || session.mode}</span>
            <span>&middot;</span>
            <span className="capitalize">{session.difficulty}</span>
            {session.start_date && (
              <>
                <span>&middot;</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(session.start_date).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {editing ? (
            <>
              <Button
                onClick={saveEdits}
                disabled={updateSession.isPending}
                className="gap-1.5"
              >
                {updateSession.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Guardar
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)} className="gap-1.5">
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={startEditing} className="gap-1.5">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>

              {session.status === 'borrador' && (
                <Button
                  onClick={() => changeStatus('activa')}
                  disabled={updateSession.isPending}
                  className="gap-1.5"
                >
                  {updateSession.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Publicar
                </Button>
              )}

              {session.status === 'activa' && (
                <Button
                  variant="outline"
                  onClick={() => changeStatus('cerrada')}
                  disabled={updateSession.isPending}
                  className="gap-1.5"
                >
                  {updateSession.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Cerrar
                </Button>
              )}

              {session.status === 'cerrada' && (
                <Button
                  onClick={() => changeStatus('activa')}
                  disabled={updateSession.isPending}
                  className="gap-1.5"
                >
                  {updateSession.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Reactivar
                </Button>
              )}

              {testRoute && (
                <Link to={`${testRoute}/${session.id}`}>
                  <Button variant="outline" className="gap-1.5">
                    <Play className="h-4 w-4" />
                    Probar {modeLabels[session.mode]}
                  </Button>
                </Link>
              )}

              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={deleteSession.isPending}
                className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
              >
                {deleteSession.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Users className="h-4 w-4 text-primary" />
              Estudiantes
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">{totalStudents}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted">
              <FileText className="h-4 w-4 text-accent" />
              Protocolos Enviados
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">{protocolsEnviados}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Tasa de Completado
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">{completionRate}%</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted">
              <BarChart3 className="h-4 w-4 text-warning" />
              Total Protocolos
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">{totalProtocols}</p>
          </CardContent>
        </Card>
      </div>

      {/* Problem statement */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Planteamiento del Problema</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <Textarea
              value={editProblem}
              onChange={(e) => setEditProblem(e.target.value)}
              placeholder="Escribe el planteamiento del problema..."
              rows={4}
            />
          ) : session.problem_statement ? (
            <p className="text-sm text-foreground leading-relaxed">
              {session.problem_statement}
            </p>
          ) : (
            <p className="text-sm text-muted italic">Sin planteamiento del problema</p>
          )}
        </CardContent>
      </Card>

      {/* Student list */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Estudiantes ({totalStudents})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStudents ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-secondary" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-40 animate-pulse rounded bg-secondary" />
                    <div className="h-2 w-24 animate-pulse rounded bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : !students || students.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="mx-auto h-10 w-10 text-muted/40" />
              <p className="mt-3 text-sm text-muted">
                Aun no hay estudiantes en esta sesion.
              </p>
              {session.status === 'borrador' && (
                <p className="mt-1 text-xs text-muted">
                  Publica la sesion para que los estudiantes puedan unirse.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {(students as unknown as StudentRow[]).map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white text-sm font-semibold">
                      {(student.name ?? 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{student.name}</p>
                      <p className="text-xs text-muted">{student.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted">Nivel {student.level}</p>
                      <p className="text-xs text-muted">{student.xp} XP</p>
                    </div>
                    {getProtocolBadge(student.protocol_status, student.protocol_step)}
                    {student.protocol_id && ['enviado', 'aprobado', 'rechazado'].includes(student.protocol_status ?? '') && (
                      <Link to={`/teacher/protocols/${student.protocol_id}`}>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          <Eye className="size-3.5" />
                          {student.protocol_status === 'enviado' ? 'Revisar' : 'Ver'}
                        </Button>
                      </Link>
                    )}
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
