import {
  Trophy,
  Star,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import type { LabExperiment } from '@/types'

interface LabResultsProps {
  experiment: LabExperiment
  score: number
  xpEarned: number
  onBack: () => void
}

export default function LabResults({
  experiment,
  score,
  xpEarned,
  onBack,
}: LabResultsProps) {
  const scoreColor =
    score >= 80
      ? 'success'
      : score >= 50
        ? 'warning'
        : 'destructive'

  const scoreLabel =
    score >= 90
      ? 'Excelente'
      : score >= 80
        ? 'Muy bien'
        : score >= 60
          ? 'Bien'
          : score >= 40
            ? 'Regular'
            : 'Necesita mejorar'

  const attempt = experiment.attempt

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Score principal */}
      <Card>
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full mb-4 ${
                score >= 80
                  ? 'bg-success/10'
                  : score >= 50
                    ? 'bg-warning/10'
                    : 'bg-destructive/10'
              }`}
            >
              {score >= 80 ? (
                <Trophy className="h-10 w-10 text-success" />
              ) : score >= 50 ? (
                <Star className="h-10 w-10 text-warning" />
              ) : (
                <XCircle className="h-10 w-10 text-destructive" />
              )}
            </div>

            <h2 className="text-3xl font-bold text-foreground mb-1">
              {score}%
            </h2>
            <p className="text-lg text-muted mb-4">{scoreLabel}</p>

            <div className="w-full max-w-xs">
              <Progress value={score} max={100} color={scoreColor} height="lg" />
            </div>

            {xpEarned > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  +{xpEarned} XP ganados
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detalles del analisis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen del analisis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-secondary/50 p-4">
            <h3 className="text-sm font-medium text-foreground mb-2">
              Experimento
            </h3>
            <p className="text-sm text-muted">{experiment.title}</p>
            {experiment.description && (
              <p className="text-xs text-muted mt-1">
                {experiment.description}
              </p>
            )}
          </div>

          {/* Resultados del estudiante */}
          {attempt?.analysis_results &&
            Object.keys(attempt.analysis_results).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Calculos realizados
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(attempt.analysis_results).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center gap-2 rounded-lg bg-secondary/30 px-3 py-2"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-muted truncate">
                            {key.replace(/_/g, ' ')}
                          </div>
                          <div className="text-sm font-mono font-medium text-foreground">
                            {typeof value === 'number'
                              ? Number.isInteger(value)
                                ? value
                                : Number(value).toFixed(4)
                              : String(value)}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Interpretacion */}
          {attempt?.interpretation && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">
                Tu interpretacion
              </h3>
              <div className="rounded-xl bg-secondary/30 p-4 text-sm text-foreground">
                {attempt.interpretation}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Volver a experimentos
        </Button>
      </div>
    </div>
  )
}
