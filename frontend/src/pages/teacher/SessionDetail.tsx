import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  FileText,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useSessionQuery, useSessionStudents } from '@/hooks/useSessions'

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const sessionId = id ? Number(id) : undefined
  const { data: session, isLoading: loadingSession } = useSessionQuery(sessionId)
  const { data: students, isLoading: loadingStudents } = useSessionStudents(sessionId)

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
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {session.title}
            </h1>
            {getStatusBadge(session.status)}
          </div>
          {session.description && (
            <p className="mt-2 text-muted max-w-2xl">{session.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className="capitalize">{session.mode}</span>
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
        <Button variant="outline">Editar Sesion</Button>
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
            <p className="mt-1 text-2xl font-bold text-foreground">--</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Tasa de Completado
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">--%</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted">
              <BarChart3 className="h-4 w-4 text-warning" />
              Puntuacion Promedio
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">--</p>
          </CardContent>
        </Card>
      </div>

      {/* Problem statement */}
      {session.problem_statement && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Planteamiento del Problema</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">
              {session.problem_statement}
            </p>
          </CardContent>
        </Card>
      )}

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
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white text-sm font-semibold">
                      {student.name.charAt(0).toUpperCase()}
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
                    <Badge variant="outline" className="text-xs">
                      En progreso
                    </Badge>
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
