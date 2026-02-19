import { Button } from '@/components/ui/Button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import type { DefenseSession } from '@/types'
import {
  Trophy,
  ArrowLeft,
  RotateCcw,
  Clock,
  Star,
  TrendingUp,
  CheckCircle,
  XCircle,
  Minus,
} from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  fundamentacion: 'Fundamentacion',
  metodologia: 'Metodologia',
  muestra: 'Muestra y Poblacion',
  instrumentos: 'Instrumentos',
  coherencia: 'Coherencia Interna',
  limitaciones: 'Limitaciones',
}

const CATEGORY_FEEDBACK: Record<string, Record<string, string>> = {
  fundamentacion: {
    high: 'Excelente dominio de los fundamentos de tu investigacion.',
    mid: 'Buena base, pero puedes profundizar mas en la justificacion del tema.',
    low: 'Necesitas reforzar la fundamentacion y relevancia de tu estudio.',
  },
  metodologia: {
    high: 'Demuestras un solido conocimiento del diseno metodologico.',
    mid: 'Conoces tu metodologia, pero hay aspectos que puedes justificar mejor.',
    low: 'Revisa a fondo tu diseno metodologico y las razones de tu eleccion.',
  },
  muestra: {
    high: 'Muy buena justificacion de la muestra y tecnica de muestreo.',
    mid: 'Tienes claridad sobre tu muestra, pero puedes mejorar la justificacion.',
    low: 'Necesitas estudiar mas sobre muestreo y representatividad.',
  },
  instrumentos: {
    high: 'Conoces bien tus instrumentos y su proceso de validacion.',
    mid: 'Tienes conocimiento basico, pero debes profundizar en validez y confiabilidad.',
    low: 'Revisa los conceptos de validacion y confiabilidad de instrumentos.',
  },
  coherencia: {
    high: 'Excelente articulacion entre los elementos de tu protocolo.',
    mid: 'Hay coherencia general, pero algunos elementos necesitan mejor conexion.',
    low: 'Trabaja en alinear tu pregunta, objetivos, hipotesis y diseno.',
  },
  limitaciones: {
    high: 'Gran capacidad de autocritica y vision de las limitaciones.',
    mid: 'Identificas algunas limitaciones, pero puedes ser mas reflexivo.',
    low: 'Es importante reconocer las limitaciones y sesgos de tu estudio.',
  },
}

interface DefenseResultsProps {
  session: DefenseSession
  onRetry: () => void
  onBack: () => void
}

export default function DefenseResults({
  session,
  onRetry,
  onBack,
}: DefenseResultsProps) {
  const overallScore = session.overall_score

  // Calcular XP que se gano
  let xpEarned = 25
  if (overallScore >= 90) xpEarned = 200
  else if (overallScore >= 70) xpEarned = 150
  else if (overallScore >= 50) xpEarned = 100

  // Formato de tiempo
  const formatTime = (seconds: number) => {
    if (!seconds) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success'
    if (score >= 50) return 'text-warning'
    return 'text-destructive'
  }

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-success'
    if (score >= 50) return 'bg-warning'
    return 'bg-destructive'
  }

  const getProgressColor = (score: number): 'success' | 'warning' | 'destructive' => {
    if (score >= 70) return 'success'
    if (score >= 50) return 'warning'
    return 'destructive'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <CheckCircle className="size-5 text-success" />
    if (score >= 50) return <Minus className="size-5 text-warning" />
    return <XCircle className="size-5 text-destructive" />
  }

  const getFeedback = (category: string, score: number) => {
    const feedbacks = CATEGORY_FEEDBACK[category]
    if (!feedbacks) return ''
    if (score >= 70) return feedbacks.high
    if (score >= 50) return feedbacks.mid
    return feedbacks.low
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Boton volver */}
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="size-4" />
        Volver al menu
      </Button>

      {/* Score general */}
      <Card
        className={`border-2 ${
          overallScore >= 70
            ? 'border-success/30 bg-success/5'
            : overallScore >= 50
              ? 'border-warning/30 bg-warning/5'
              : 'border-destructive/30 bg-destructive/5'
        }`}
      >
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div
              className={`size-24 rounded-full flex items-center justify-center ${getScoreBg(overallScore)} text-white shadow-lg`}
            >
              <span className="text-3xl font-bold">{overallScore}</span>
            </div>
          </div>

          <h2
            className={`text-2xl font-bold ${getScoreColor(overallScore)} mb-2`}
          >
            {overallScore >= 90
              ? 'Defensa Sobresaliente!'
              : overallScore >= 70
                ? 'Buena Defensa!'
                : overallScore >= 50
                  ? 'Defensa Aceptable'
                  : 'Necesitas Prepararte Mas'}
          </h2>

          <p className="text-muted mb-4">
            {overallScore >= 90
              ? 'Has demostrado un dominio excepcional de tu protocolo.'
              : overallScore >= 70
                ? 'Buen manejo de tu protocolo, con areas de mejora menores.'
                : overallScore >= 50
                  ? 'Conoces tu protocolo pero hay aspectos importantes por reforzar.'
                  : 'Te recomendamos revisar tu protocolo a profundidad antes de la defensa real.'}
          </p>

          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Star className="size-4 text-primary" />
              <span className="font-semibold text-primary">
                +{xpEarned} XP
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Clock className="size-4" />
              <span>{formatTime(session.time_spent)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <TrendingUp className="size-4" />
              <span>
                {session.scores.filter((s) => s >= 60).length}/
                {session.scores.length} buenas
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalle por pregunta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5 text-primary" />
            Detalle por Pregunta
          </CardTitle>
          <CardDescription>
            Revisa cada pregunta, tu respuesta y la puntuacion obtenida
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {session.questions.map((question, idx) => {
            const score = session.scores[idx] || 0
            const answerText = session.answers[idx] || ''

            return (
              <div
                key={idx}
                className="border border-border rounded-xl p-4 space-y-3"
              >
                {/* Encabezado de la pregunta */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {CATEGORY_LABELS[question.category] ||
                          question.category}
                      </Badge>
                      <span className="text-xs text-muted">
                        Pregunta {idx + 1}
                      </span>
                    </div>
                    <p className="font-medium text-foreground text-sm">
                      {question.text}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getScoreIcon(score)}
                    <span
                      className={`font-bold text-lg ${getScoreColor(score)}`}
                    >
                      {score}
                    </span>
                  </div>
                </div>

                {/* Barra de score */}
                <Progress
                  value={score}
                  max={100}
                  color={getProgressColor(score)}
                  height="sm"
                />

                {/* Respuesta del estudiante */}
                {answerText ? (
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted mb-1">
                      Tu respuesta:
                    </p>
                    <p className="text-sm text-foreground">{answerText}</p>
                  </div>
                ) : (
                  <div className="bg-destructive/5 rounded-lg p-3">
                    <p className="text-sm text-destructive italic">
                      No respondida
                    </p>
                  </div>
                )}

                {/* Feedback por categoria */}
                <p className="text-xs text-muted italic">
                  {getFeedback(question.category, score)}
                </p>
              </div>
            )
          })}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="size-4" />
            Volver
          </Button>
          <Button onClick={onRetry} className="flex-1">
            <RotateCcw className="size-4" />
            Intentar de Nuevo
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
