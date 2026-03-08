import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  Target,
  HelpCircle,
  FlaskConical,
  Users2,
  ClipboardList,
  Microscope,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import { useProtocolQuery, useReviewProtocol } from '@/hooks/useProtocol'
import type { Protocol, Variable } from '@/types'

function getStatusBadge(status: Protocol['status']) {
  switch (status) {
    case 'enviado':
      return <Badge variant="default">Enviado</Badge>
    case 'aprobado':
      return <Badge variant="success">Aprobado</Badge>
    case 'rechazado':
      return <Badge variant="destructive">Rechazado</Badge>
    case 'en_progreso':
      return <Badge variant="secondary">En progreso</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getVariableTypeBadge(type: Variable['type']) {
  switch (type) {
    case 'independiente':
      return <Badge variant="default">Independiente</Badge>
    case 'dependiente':
      return <Badge variant="secondary">Dependiente</Badge>
    case 'interviniente':
      return <Badge variant="outline">Interviniente</Badge>
    default:
      return <Badge variant="outline">{type}</Badge>
  }
}

export default function ProtocolReview() {
  const { protocolId } = useParams<{ protocolId: string }>()
  const id = protocolId ? Number(protocolId) : undefined
  const navigate = useNavigate()

  const { data: protocol, isLoading } = useProtocolQuery(id)
  const reviewMutation = useReviewProtocol()

  const [feedback, setFeedback] = useState('')

  async function handleReview(status: 'aprobado' | 'rechazado') {
    if (!id) return
    if (status === 'rechazado' && !feedback.trim()) return

    await reviewMutation.mutateAsync({
      id,
      status,
      feedback: feedback.trim() || undefined,
    })
    navigate(-1)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-96" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!protocol) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted/50" />
        <h2 className="mt-4 text-lg font-medium text-foreground">Protocolo no encontrado</h2>
        <Link to="/teacher/sessions" className="mt-4 inline-block">
          <Button variant="outline">Volver a sesiones</Button>
        </Link>
      </div>
    )
  }

  const canReview = protocol.status === 'enviado'

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Revision de Protocolo
          </h1>
          <p className="mt-1 text-muted">
            {protocol.student_name} &middot; {protocol.session_title}
          </p>
        </div>
        {getStatusBadge(protocol.status)}
      </div>

      {/* Grid: protocolo | acciones */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna izquierda: secciones del protocolo */}
        <div className="lg:col-span-2 space-y-4">
          {/* 1. Planteamiento del problema */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                1. Planteamiento del Problema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {protocol.problem_statement || <span className="text-muted italic">No completado</span>}
              </p>
            </CardContent>
          </Card>

          {/* 2. Pregunta de investigacion */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <HelpCircle className="h-4 w-4 text-primary" />
                2. Pregunta de Investigacion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">
                {protocol.research_question || <span className="text-muted italic">No completado</span>}
              </p>
            </CardContent>
          </Card>

          {/* 3. Objetivos */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-primary" />
                3. Objetivos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted mb-1">Objetivo General</p>
                <p className="text-sm text-foreground">
                  {protocol.general_objective || <span className="text-muted italic">No completado</span>}
                </p>
              </div>
              {protocol.specific_objectives && protocol.specific_objectives.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted mb-1">Objetivos Especificos</p>
                  <ul className="list-disc list-inside space-y-1">
                    {protocol.specific_objectives.map((obj, i) => (
                      <li key={i} className="text-sm text-foreground">{obj}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. Variables */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FlaskConical className="h-4 w-4 text-primary" />
                4. Variables
              </CardTitle>
            </CardHeader>
            <CardContent>
              {protocol.variables && protocol.variables.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 pr-4 text-xs font-medium text-muted">Nombre</th>
                        <th className="pb-2 pr-4 text-xs font-medium text-muted">Tipo</th>
                        <th className="pb-2 pr-4 text-xs font-medium text-muted">Def. Conceptual</th>
                        <th className="pb-2 text-xs font-medium text-muted">Def. Operacional</th>
                      </tr>
                    </thead>
                    <tbody>
                      {protocol.variables.map((v, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0">
                          <td className="py-2 pr-4 font-medium text-foreground">{v.name}</td>
                          <td className="py-2 pr-4">{getVariableTypeBadge(v.type)}</td>
                          <td className="py-2 pr-4 text-foreground">{v.conceptual_definition}</td>
                          <td className="py-2 text-foreground">{v.operational_definition}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted italic">No se definieron variables</p>
              )}
            </CardContent>
          </Card>

          {/* 5. Diseno */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-4 w-4 text-primary" />
                5. Diseno de Investigacion
              </CardTitle>
            </CardHeader>
            <CardContent>
              {protocol.research_design ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium text-muted mb-1">Enfoque</p>
                    <p className="text-sm text-foreground capitalize">{protocol.research_design.approach}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted mb-1">Tipo</p>
                    <p className="text-sm text-foreground">{protocol.research_design.type}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted mb-1">Alcance</p>
                    <p className="text-sm text-foreground capitalize">{protocol.research_design.scope}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted italic">No completado</p>
              )}
            </CardContent>
          </Card>

          {/* 6. Muestra */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users2 className="h-4 w-4 text-primary" />
                6. Muestra
              </CardTitle>
            </CardHeader>
            <CardContent>
              {protocol.sample ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted mb-1">Poblacion</p>
                    <p className="text-sm text-foreground">{protocol.sample.population}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted mb-1">Tamano</p>
                    <p className="text-sm text-foreground">{protocol.sample.size}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted mb-1">Tecnica de muestreo</p>
                    <p className="text-sm text-foreground">{protocol.sample.technique}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted mb-1">Justificacion</p>
                    <p className="text-sm text-foreground">{protocol.sample.justification}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted italic">No completado</p>
              )}
            </CardContent>
          </Card>

          {/* 7. Instrumentos */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Microscope className="h-4 w-4 text-primary" />
                7. Instrumentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {protocol.instruments && protocol.instruments.length > 0 ? (
                <div className="space-y-3">
                  {protocol.instruments.map((inst, i) => (
                    <div key={i} className="rounded-lg border border-border/50 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground">{inst.name}</p>
                        <Badge variant="outline" className="text-xs">{inst.type}</Badge>
                      </div>
                      <p className="text-sm text-muted">{inst.description}</p>
                      {inst.variables_measured && inst.variables_measured.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {inst.variables_measured.map((vm, j) => (
                            <Badge key={j} variant="secondary" className="text-xs">{vm}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted italic">No se definieron instrumentos</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: acciones de revision */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Revision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {getStatusBadge(protocol.status)}
                  <span className="text-sm text-foreground">{protocol.student_name}</span>
                </div>

                {protocol.student_email && (
                  <p className="text-xs text-muted">{protocol.student_email}</p>
                )}

                {/* Feedback previo si existe */}
                {protocol.validations && protocol.validations.filter(v => v.field === 'revision_docente').length > 0 && (
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs font-medium text-muted mb-1">Feedback anterior</p>
                    {protocol.validations
                      .filter(v => v.field === 'revision_docente')
                      .map((v, i) => (
                        <p key={i} className="text-sm text-foreground">{v.message}</p>
                      ))
                    }
                  </div>
                )}

                {canReview ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Retroalimentacion
                      </label>
                      <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Escribe tu retroalimentacion para el estudiante..."
                        rows={5}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleReview('aprobado')}
                        disabled={reviewMutation.isPending}
                        className="w-full gap-2 bg-success hover:bg-success/90"
                      >
                        {reviewMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-4" />
                        )}
                        Aprobar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReview('rechazado')}
                        disabled={reviewMutation.isPending || !feedback.trim()}
                        className="w-full gap-2 border-destructive text-destructive hover:bg-destructive hover:text-white"
                      >
                        {reviewMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <XCircle className="size-4" />
                        )}
                        Rechazar
                      </Button>
                      {!feedback.trim() && (
                        <p className="text-xs text-muted">
                          Para rechazar, debes incluir retroalimentacion.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg bg-secondary/50 p-3 text-center">
                    <p className="text-sm text-muted">
                      {protocol.status === 'aprobado'
                        ? 'Este protocolo ya fue aprobado.'
                        : protocol.status === 'rechazado'
                          ? 'Este protocolo fue rechazado. El estudiante puede editarlo y reenviarlo.'
                          : 'Este protocolo aun no ha sido enviado para revision.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
