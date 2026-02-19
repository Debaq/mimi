import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  FlaskConical,
  Play,
  CheckCircle2,
  Clock,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSessionQuery } from '@/hooks/useSessions'
import {
  useLabExperiments,
  useStartAttempt,
} from '@/hooks/useLaboratory'
import LabWorkbench from '@/components/laboratory/LabWorkbench'
import LabResults from '@/components/laboratory/LabResults'
import type { LabExperiment } from '@/types'

export default function Laboratory() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const id = sessionId ? Number(sessionId) : undefined
  const { data: session, isLoading: sessionLoading } = useSessionQuery(id)
  const { data: experiments, isLoading: experimentsLoading } =
    useLabExperiments(id)
  const startAttempt = useStartAttempt()

  const [activeExperiment, setActiveExperiment] =
    useState<LabExperiment | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<{
    score: number
    xp_earned: number
  } | null>(null)

  const isLoading = sessionLoading || experimentsLoading

  function handleStartExperiment(experiment: LabExperiment) {
    if (experiment.attempt) {
      setActiveExperiment(experiment)
      if (experiment.attempt.status === 'completado') {
        setSubmissionResult({
          score: experiment.attempt.score,
          xp_earned: 0,
        })
        setShowResults(true)
      }
      return
    }

    startAttempt.mutate(experiment.id, {
      onSuccess: (response) => {
        setActiveExperiment({
          ...experiment,
          attempt: response.data,
        })
      },
    })
  }

  function handleSubmitted(result: { score: number; xp_earned: number }) {
    setSubmissionResult(result)
    setShowResults(true)
  }

  function handleBackToList() {
    setActiveExperiment(null)
    setShowResults(false)
    setSubmissionResult(null)
  }

  // Vista de resultados
  if (showResults && submissionResult && activeExperiment) {
    return (
      <div className="space-y-6">
        <button
          onClick={handleBackToList}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a experimentos
        </button>

        <LabResults
          experiment={activeExperiment}
          score={submissionResult.score}
          xpEarned={submissionResult.xp_earned}
          onBack={handleBackToList}
        />
      </div>
    )
  }

  // Vista del workbench (laboratorio activo)
  if (activeExperiment && activeExperiment.attempt) {
    return (
      <div className="space-y-6">
        <button
          onClick={handleBackToList}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a experimentos
        </button>

        <LabWorkbench
          experiment={activeExperiment}
          attempt={activeExperiment.attempt}
          onSubmitted={handleSubmitted}
        />
      </div>
    )
  }

  // Vista lista de experimentos
  return (
    <div className="space-y-6">
      <Link
        to="/sessions"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a sesiones
      </Link>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FlaskConical className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                Laboratorio Estadistico
              </h1>
              {session && (
                <p className="text-sm text-muted">
                  Sesion: {session.title}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : experiments && experiments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {experiments.map((experiment) => (
            <ExperimentCard
              key={experiment.id}
              experiment={experiment}
              onStart={() => handleStartExperiment(experiment)}
              isStarting={startAttempt.isPending}
            />
          ))}
        </div>
      ) : (
        <Card className="border-border/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
              <FlaskConical className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Sin experimentos disponibles
            </h2>
            <p className="text-sm text-muted text-center max-w-sm">
              Tu docente aun no ha creado experimentos para esta sesion.
              Vuelve mas tarde.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ExperimentCard({
  experiment,
  onStart,
  isStarting,
}: {
  experiment: LabExperiment
  onStart: () => void
  isStarting: boolean
}) {
  const isCompleted = experiment.attempt?.status === 'completado'
  const isInProgress = experiment.attempt?.status === 'en_progreso'

  const difficultyLabel =
    experiment.difficulty === 1
      ? 'Basico'
      : experiment.difficulty === 2
        ? 'Intermedio'
        : 'Avanzado'

  const difficultyVariant =
    experiment.difficulty === 1
      ? 'secondary'
      : experiment.difficulty === 2
        ? 'default'
        : 'destructive'

  return (
    <Card
      className={
        isCompleted
          ? 'border-success/30 bg-success/5'
          : isInProgress
            ? 'border-primary/30 bg-primary/5'
            : ''
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{experiment.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={difficultyVariant as 'default' | 'secondary' | 'destructive'}>
              {difficultyLabel}
            </Badge>
            {isCompleted && (
              <Badge variant="success">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Completado
              </Badge>
            )}
            {isInProgress && (
              <Badge variant="outline">
                <Clock className="mr-1 h-3 w-3" />
                En progreso
              </Badge>
            )}
          </div>
        </div>
        {experiment.description && (
          <CardDescription className="mt-1">
            {experiment.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted">
            <span>{experiment.dataset_headers.length} columnas</span>
            <span>{experiment.dataset.length} registros</span>
          </div>

          {isCompleted ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                <Star className="h-4 w-4 text-warning" />
                {experiment.attempt?.score}%
              </div>
              <Button size="sm" variant="outline" onClick={onStart}>
                Ver resultados
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={onStart}
              disabled={isStarting}
            >
              {isInProgress ? (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Continuar
                </>
              ) : (
                <>
                  <FlaskConical className="h-3.5 w-3.5" />
                  Iniciar
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
