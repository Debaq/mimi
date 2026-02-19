import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  Shield,
  Clock,
  Star,
  CheckCircle2,
  PlayCircle,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { useDetectiveCases, useStartDetectiveAttempt } from '@/hooks/useDetective'
import { useSessionQuery } from '@/hooks/useSessions'
import { toast } from '@/components/ui/Toast'
import DetectiveGame from '@/components/detective/DetectiveGame'
import DetectiveResults from '@/components/detective/DetectiveResults'
import type { DetectiveCase, DetectiveSubmitResponse } from '@/types'

export default function Detective() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const id = sessionId ? Number(sessionId) : undefined
  const { data: session, isLoading: sessionLoading } = useSessionQuery(id)
  const { data: cases, isLoading: casesLoading } = useDetectiveCases(id)
  const startAttempt = useStartDetectiveAttempt()

  const [activeCase, setActiveCase] = useState<DetectiveCase | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [submitResults, setSubmitResults] = useState<DetectiveSubmitResponse | null>(null)

  const isLoading = sessionLoading || casesLoading

  function handleStartCase(detectiveCase: DetectiveCase) {
    if (detectiveCase.attempt?.status === 'completado') {
      // Mostrar resultados directamente si ya completo
      setActiveCase(detectiveCase)
      setShowResults(true)
      return
    }

    startAttempt.mutate(detectiveCase.id, {
      onSuccess: (response) => {
        const updatedCase = {
          ...detectiveCase,
          attempt: response.data,
        }
        setActiveCase(updatedCase)
        setShowResults(false)
      },
      onError: (error) => {
        toast('error', error.message || 'Error al iniciar el caso')
      },
    })
  }

  function handleSubmitComplete(results: DetectiveSubmitResponse) {
    setSubmitResults(results)
    setShowResults(true)
  }

  function handleBackToList() {
    setActiveCase(null)
    setShowResults(false)
    setSubmitResults(null)
  }

  function getDifficultyBadge(difficulty: number) {
    switch (difficulty) {
      case 1:
        return <Badge variant="success">Basico</Badge>
      case 2:
        return <Badge variant="default">Intermedio</Badge>
      case 3:
        return <Badge variant="destructive">Avanzado</Badge>
      default:
        return <Badge variant="outline">Nivel {difficulty}</Badge>
    }
  }

  function getCaseStatus(c: DetectiveCase) {
    if (!c.attempt) return 'no_iniciado'
    if (c.attempt.status === 'completado') return 'completado'
    return 'en_progreso'
  }

  function getStatusBadge(c: DetectiveCase) {
    const status = getCaseStatus(c)
    switch (status) {
      case 'completado':
        return <Badge variant="success">Completado</Badge>
      case 'en_progreso':
        return <Badge variant="default">En Progreso</Badge>
      default:
        return <Badge variant="outline">No Iniciado</Badge>
    }
  }

  // Si hay un caso activo, mostrar el juego o los resultados
  if (activeCase) {
    if (showResults) {
      return (
        <DetectiveResults
          detectiveCase={activeCase}
          results={submitResults}
          onBack={handleBackToList}
        />
      )
    }

    return (
      <DetectiveGame
        detectiveCase={activeCase}
        sessionShowHints={session?.show_hints ?? true}
        onSubmitComplete={handleSubmitComplete}
        onBack={handleBackToList}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        to="/sessions"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a sesiones
      </Link>

      {/* Header */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-8 w-64 animate-pulse rounded-xl bg-secondary" />
          <div className="h-4 w-48 animate-pulse rounded-lg bg-secondary" />
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Search className="h-5 w-5 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Detective Metodologico
            </h1>
          </div>
          {session && (
            <p className="mt-1 text-muted ml-13">
              Sesion: {session.title} -- Encuentra los errores en los protocolos de investigacion.
            </p>
          )}
        </div>
      )}

      {/* Cases grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : !cases || cases.length === 0 ? (
        <div className="py-16 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No hay casos disponibles
          </h3>
          <p className="mt-1 text-sm text-muted">
            El docente aun no ha creado casos para esta sesion.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => {
            const status = getCaseStatus(c)
            return (
              <Card
                key={c.id}
                className="group border-border/50 transition-all hover:shadow-md"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                      {status === 'completado' ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : status === 'en_progreso' ? (
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      ) : (
                        <Search className="h-5 w-5 text-amber-500" />
                      )}
                    </div>
                    {getStatusBadge(c)}
                  </div>

                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {c.title}
                  </h3>
                  <p className="text-sm text-muted line-clamp-2 mb-4">
                    {c.description || 'Sin descripcion'}
                  </p>

                  {/* Score si completado */}
                  {status === 'completado' && c.attempt && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted">Puntuacion</span>
                        <span className="font-semibold text-foreground">
                          {c.attempt.score}/100
                        </span>
                      </div>
                      <Progress
                        value={c.attempt.score}
                        max={100}
                        color={
                          c.attempt.score >= 80
                            ? 'success'
                            : c.attempt.score >= 60
                              ? 'warning'
                              : 'destructive'
                        }
                        height="sm"
                      />
                      <p className="text-xs text-muted mt-1">
                        {c.attempt.errors_found}/{c.attempt.errors_total} errores encontrados
                      </p>
                    </div>
                  )}

                  {/* In progress info */}
                  {status === 'en_progreso' && c.attempt && (
                    <div className="mb-4">
                      <p className="text-xs text-muted">
                        {(c.attempt.annotations ?? []).length} anotaciones realizadas
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {getDifficultyBadge(c.difficulty)}
                      {c.time_limit > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {c.time_limit} min
                        </Badge>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleStartCase(c)}
                      disabled={startAttempt.isPending}
                    >
                      {status === 'completado' ? (
                        <>
                          <Star className="h-3.5 w-3.5" />
                          Ver Resultados
                        </>
                      ) : status === 'en_progreso' ? (
                        <>
                          <PlayCircle className="h-3.5 w-3.5" />
                          Continuar
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-3.5 w-3.5" />
                          Iniciar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
