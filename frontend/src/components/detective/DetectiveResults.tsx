import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  Star,
  Target,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import ProgressRing from '@/components/dashboard/ProgressRing'
import type { DetectiveCase, DetectiveSubmitResponse } from '@/types'

interface DetectiveResultsProps {
  detectiveCase: DetectiveCase
  results: DetectiveSubmitResponse | null
  onBack: () => void
}

const ERROR_TYPE_LABELS: Record<string, string> = {
  incoherencia: 'Incoherencia',
  ausencia: 'Ausencia',
  contradiccion: 'Contradiccion',
  error_logico: 'Error Logico',
  sesgo: 'Sesgo',
}

const SEVERITY_COLORS: Record<string, string> = {
  alta: 'destructive',
  media: 'default',
  baja: 'secondary',
}

export default function DetectiveResults({
  detectiveCase,
  results,
  onBack,
}: DetectiveResultsProps) {
  // Si no hay results del submit, usar los datos del attempt existente
  const score = results?.score ?? detectiveCase.attempt?.score ?? 0
  const errorsFound = results?.errors_found ?? detectiveCase.attempt?.errors_found ?? 0
  const errorsTotal = results?.errors_total ?? detectiveCase.attempt?.errors_total ?? 0
  const xpEarned = results?.xp_earned ?? 0
  const detailedResults = results?.results ?? []

  function getScoreColor(s: number): string {
    if (s >= 80) return 'var(--color-success, #22c55e)'
    if (s >= 60) return 'var(--color-warning, #f59e0b)'
    return 'var(--color-destructive, #ef4444)'
  }

  function getScoreLabel(s: number): string {
    if (s >= 90) return 'Excelente'
    if (s >= 80) return 'Muy bien'
    if (s >= 60) return 'Bien'
    if (s >= 40) return 'Regular'
    return 'Necesitas mejorar'
  }

  function getScoreProgressColor(s: number): 'success' | 'warning' | 'destructive' {
    if (s >= 80) return 'success'
    if (s >= 60) return 'warning'
    return 'destructive'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Resultados: {detectiveCase.title}
          </h1>
          <p className="text-sm text-muted">
            Revision de tu analisis del protocolo
          </p>
        </div>
      </div>

      {/* Score overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score principal */}
        <Card className="md:col-span-1">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <ProgressRing
              percentage={score}
              size={140}
              strokeWidth={10}
              color={getScoreColor(score)}
            />
            <p className="mt-4 text-lg font-bold text-foreground">
              {getScoreLabel(score)}
            </p>
            <p className="text-sm text-muted">Puntuacion final</p>
          </CardContent>
        </Card>

        {/* Estadisticas */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumen del Analisis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Errores encontrados */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-muted flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Errores encontrados
                </span>
                <span className="font-semibold text-foreground">
                  {errorsFound} / {errorsTotal}
                </span>
              </div>
              <Progress
                value={errorsFound}
                max={errorsTotal || 1}
                color={getScoreProgressColor((errorsFound / (errorsTotal || 1)) * 100)}
              />
            </div>

            {/* Score desglosado */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-muted flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Deteccion (70%)
                </span>
                <span className="font-semibold text-foreground">
                  {errorsTotal > 0 ? Math.round((errorsFound / errorsTotal) * 70) : 0} / 70
                </span>
              </div>
              <Progress
                value={errorsTotal > 0 ? Math.round((errorsFound / errorsTotal) * 70) : 0}
                max={70}
                color="primary"
                height="sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-muted flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Calidad de explicaciones (30%)
                </span>
                <span className="font-semibold text-foreground">
                  {Math.max(0, score - (errorsTotal > 0 ? Math.round((errorsFound / errorsTotal) * 70) : 0))} / 30
                </span>
              </div>
              <Progress
                value={Math.max(0, score - (errorsTotal > 0 ? Math.round((errorsFound / errorsTotal) * 70) : 0))}
                max={30}
                color="accent"
                height="sm"
              />
            </div>

            {/* XP ganado */}
            {xpEarned > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">
                  +{xpEarned} XP ganados
                </span>
              </div>
            )}

            {/* Pistas usadas */}
            {detectiveCase.attempt && detectiveCase.attempt.hints_used > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-3">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span className="text-sm text-amber-600">
                  {detectiveCase.attempt.hints_used} pista(s) usada(s) (-{detectiveCase.attempt.hints_used * 5} pts)
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detalle de errores */}
      {detailedResults.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Detalle de Errores</CardTitle>
            <p className="text-xs text-muted">
              Comparacion entre tu analisis y los errores reales del protocolo
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {detailedResults.map((result, index) => (
              <div
                key={index}
                className={`rounded-xl border p-4 ${
                  result.found
                    ? 'border-success/30 bg-success/5'
                    : 'border-destructive/30 bg-destructive/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {result.found ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        {result.found ? 'Encontrado' : 'No detectado'}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        {result.field}
                      </Badge>
                      <Badge
                        variant={
                          (SEVERITY_COLORS[result.severity] ?? 'outline') as 'destructive' | 'default' | 'secondary' | 'outline'
                        }
                        className="text-xs"
                      >
                        {ERROR_TYPE_LABELS[result.type] ?? result.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        Severidad: {result.severity}
                      </Badge>
                    </div>

                    <p className="text-sm text-foreground/80">
                      {result.description}
                    </p>

                    {result.found && result.student_explanation && (
                      <div className="mt-2 rounded-lg bg-secondary/50 p-3">
                        <p className="text-xs font-medium text-muted mb-1">Tu explicacion:</p>
                        <p className="text-sm text-foreground/70">
                          {result.student_explanation}
                        </p>
                      </div>
                    )}

                    {!result.found && (
                      <div className="mt-2 rounded-lg bg-secondary/50 p-3">
                        <p className="text-xs font-medium text-muted mb-1 flex items-center gap-1">
                          <EyeOff className="h-3 w-3" />
                          Error no detectado
                        </p>
                        <p className="text-sm text-foreground/70">
                          Revisa esta seccion con mas atencion la proxima vez.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Boton volver */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Volver a la lista de casos
        </Button>
      </div>
    </div>
  )
}
