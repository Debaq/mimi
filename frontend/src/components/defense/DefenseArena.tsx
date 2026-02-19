import { useState, useEffect, useRef, useCallback } from 'react'
import { useAnswerDefense, useFinishDefense } from '@/hooks/useDefense'
import { toast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import {
  Card,
  CardContent,
} from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import type { DefenseSession, Protocol } from '@/types'
import {
  Clock,
  User,
  ChevronRight,
  MessageSquare,
  CheckCircle,
} from 'lucide-react'

// Nombres de jurado simulados (deterministas basados en el protocolo)
const JURY_NAMES = [
  { name: 'Dra. Martinez', specialty: 'Metodologia' },
  { name: 'Dr. Hernandez', specialty: 'Estadistica' },
  { name: 'Mtra. Lopez', specialty: 'Investigacion' },
]

const CATEGORY_LABELS: Record<string, string> = {
  fundamentacion: 'Fundamentacion',
  metodologia: 'Metodologia',
  muestra: 'Muestra y Poblacion',
  instrumentos: 'Instrumentos',
  coherencia: 'Coherencia Interna',
  limitaciones: 'Limitaciones',
}

const CATEGORY_COLORS: Record<string, string> = {
  fundamentacion: 'bg-blue-500',
  metodologia: 'bg-purple-500',
  muestra: 'bg-amber-500',
  instrumentos: 'bg-emerald-500',
  coherencia: 'bg-rose-500',
  limitaciones: 'bg-slate-500',
}

interface DefenseArenaProps {
  session: DefenseSession
  protocol: Protocol
  onComplete: (session: DefenseSession, xpEarned: number) => void
}

export default function DefenseArena({
  session,
  protocol,
  onComplete,
}: DefenseArenaProps) {
  const [currentQuestion, setCurrentQuestion] = useState(() => {
    // Encontrar la primera pregunta sin responder
    const firstUnanswered = session.answers.findIndex(
      (a) => !a || a.trim() === ''
    )
    return firstUnanswered >= 0 ? firstUnanswered : 0
  })
  const [answer, setAnswer] = useState('')
  const [answers, setAnswers] = useState<string[]>([...session.answers])
  const [scores, setScores] = useState<number[]>([...session.scores])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(() => {
    // Calcular tiempo restante basado en started_at
    if (session.started_at) {
      const started = new Date(session.started_at).getTime()
      const now = Date.now()
      const elapsed = Math.floor((now - started) / 1000)
      const limit = session.time_limit * 60
      return Math.max(0, limit - elapsed)
    }
    return session.time_limit * 60
  })
  const [isFinished, setIsFinished] = useState(false)
  const startTimeRef = useRef(Date.now())

  const answerDefense = useAnswerDefense()
  const finishDefense = useFinishDefense()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const totalQuestions = session.questions.length
  const question = session.questions[currentQuestion]

  // El jurado que "hace" la pregunta actual
  const currentJury = JURY_NAMES[currentQuestion % JURY_NAMES.length]

  // Manejar finalizacion
  const handleFinish = useCallback(async () => {
    if (isFinished) return
    setIsFinished(true)

    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000)

    try {
      const response = await finishDefense.mutateAsync({
        sessionId: session.id,
        time_spent: timeSpent,
      })
      onComplete(response.data.session, response.data.xp_earned)
    } catch (err) {
      setIsFinished(false)
      const errorMessage =
        err instanceof Error ? err.message : 'Error al finalizar la defensa'
      toast('error', errorMessage)
    }
  }, [isFinished, session.id, finishDefense, onComplete])

  // Cronometro countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      handleFinish()
      return
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLeft, handleFinish])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || answerDefense.isPending) return

    try {
      const response = await answerDefense.mutateAsync({
        sessionId: session.id,
        question_index: currentQuestion,
        answer: answer.trim(),
      })

      // Actualizar estado local
      const newAnswers = [...answers]
      newAnswers[currentQuestion] = answer.trim()
      setAnswers(newAnswers)

      const newScores = [...scores]
      newScores[currentQuestion] = response.data.score
      setScores(newScores)

      // Transicion a la siguiente pregunta
      setIsTransitioning(true)

      setTimeout(() => {
        if (currentQuestion < totalQuestions - 1) {
          setCurrentQuestion(currentQuestion + 1)
          setAnswer('')
          setIsTransitioning(false)

          // Focus en textarea
          setTimeout(() => {
            textareaRef.current?.focus()
          }, 100)
        } else {
          // Ultima pregunta - finalizar
          setIsTransitioning(false)
          handleFinish()
        }
      }, 800)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error al enviar la respuesta'
      toast('error', errorMessage)
    }
  }

  const isTimeWarning = timeLeft < 300 // menos de 5 minutos
  const isTimeCritical = timeLeft < 60 // menos de 1 minuto

  return (
    <div className="min-h-screen bg-background">
      {/* Barra superior con cronometro y progreso */}
      <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">
                Pregunta {currentQuestion + 1} / {totalQuestions}
              </Badge>
              <Badge
                variant="secondary"
                className={`${CATEGORY_COLORS[question?.category] || 'bg-primary'} text-white`}
              >
                {CATEGORY_LABELS[question?.category] || question?.category}
              </Badge>
            </div>

            <div
              className={`flex items-center gap-2 font-mono text-lg font-bold ${
                isTimeCritical
                  ? 'text-destructive animate-pulse'
                  : isTimeWarning
                    ? 'text-warning'
                    : 'text-foreground'
              }`}
            >
              <Clock className="size-5" />
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="mt-2">
            <Progress
              value={currentQuestion + 1}
              max={totalQuestions}
              color="primary"
              height="sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Panel del jurado */}
        <div className="flex justify-center gap-4 sm:gap-8 py-4">
          {JURY_NAMES.map((jury, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                idx === currentQuestion % JURY_NAMES.length
                  ? 'scale-110 opacity-100'
                  : 'scale-90 opacity-40'
              }`}
            >
              <div
                className={`size-14 sm:size-16 rounded-full flex items-center justify-center border-2 ${
                  idx === currentQuestion % JURY_NAMES.length
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-secondary'
                }`}
              >
                <User
                  className={`size-7 sm:size-8 ${
                    idx === currentQuestion % JURY_NAMES.length
                      ? 'text-primary'
                      : 'text-muted'
                  }`}
                />
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm font-medium text-foreground">
                  {jury.name}
                </p>
                <p className="text-[10px] sm:text-xs text-muted">
                  {jury.specialty}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pregunta actual */}
        <div
          className={`transition-all duration-500 ${
            isTransitioning
              ? 'opacity-0 translate-y-4'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <Card className="border-primary/20">
            <CardContent className="p-6">
              {/* Quien pregunta */}
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="size-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {currentJury.name} pregunta:
                </span>
              </div>

              {/* Texto de la pregunta */}
              <p className="text-lg font-semibold text-foreground leading-relaxed">
                {question?.text}
              </p>

              {/* Contexto */}
              {question?.context && (
                <div className="mt-3 p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-sm text-muted italic">
                    {question.context}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Respuestas previas (indicadores) */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalQuestions }).map((_, idx) => (
            <div
              key={idx}
              className={`size-3 rounded-full transition-all ${
                idx === currentQuestion
                  ? 'bg-primary scale-125'
                  : answers[idx] && answers[idx].trim() !== ''
                    ? scores[idx] >= 60
                      ? 'bg-success'
                      : scores[idx] >= 30
                        ? 'bg-warning'
                        : 'bg-destructive'
                    : 'bg-border'
              }`}
              title={
                idx === currentQuestion
                  ? 'Pregunta actual'
                  : answers[idx] && answers[idx].trim() !== ''
                    ? `Pregunta ${idx + 1}: ${scores[idx]} pts`
                    : `Pregunta ${idx + 1}: sin responder`
              }
            />
          ))}
        </div>

        {/* Area de respuesta */}
        <div
          className={`transition-all duration-500 ${
            isTransitioning
              ? 'opacity-0 translate-y-4'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Tu respuesta:
                </label>
                <span
                  className={`text-xs ${
                    answer.split(/\s+/).filter(Boolean).length < 30
                      ? 'text-muted'
                      : 'text-success'
                  }`}
                >
                  {answer.split(/\s+/).filter(Boolean).length} palabras
                  {answer.split(/\s+/).filter(Boolean).length < 30
                    ? ' (minimo recomendado: 30)'
                    : ''}
                </span>
              </div>

              <Textarea
                ref={textareaRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Escribe tu respuesta aqui. Argumenta de forma clara y menciona los conceptos clave de tu protocolo..."
                className="min-h-[160px] text-base"
                disabled={answerDefense.isPending || isFinished}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleSubmitAnswer()
                  }
                }}
              />

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">
                  Ctrl + Enter para enviar
                </p>
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={
                    !answer.trim() || answerDefense.isPending || isFinished
                  }
                >
                  {answerDefense.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Evaluando...
                    </span>
                  ) : currentQuestion < totalQuestions - 1 ? (
                    <span className="flex items-center gap-2">
                      Responder
                      <ChevronRight className="size-4" />
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="size-4" />
                      Finalizar Defensa
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info del protocolo (colapsable) */}
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted hover:text-foreground transition-colors flex items-center gap-1">
            <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
            Ver resumen de tu protocolo
          </summary>
          <Card className="mt-2">
            <CardContent className="p-4 space-y-2 text-sm">
              {protocol.problem_statement && (
                <div>
                  <span className="font-medium text-foreground">
                    Planteamiento:{' '}
                  </span>
                  <span className="text-muted">
                    {protocol.problem_statement.substring(0, 200)}
                    {protocol.problem_statement.length > 200 ? '...' : ''}
                  </span>
                </div>
              )}
              {protocol.research_question && (
                <div>
                  <span className="font-medium text-foreground">
                    Pregunta:{' '}
                  </span>
                  <span className="text-muted">
                    {protocol.research_question}
                  </span>
                </div>
              )}
              {protocol.general_objective && (
                <div>
                  <span className="font-medium text-foreground">
                    Objetivo general:{' '}
                  </span>
                  <span className="text-muted">
                    {protocol.general_objective}
                  </span>
                </div>
              )}
              {protocol.hypothesis && (
                <div>
                  <span className="font-medium text-foreground">
                    Hipotesis:{' '}
                  </span>
                  <span className="text-muted">{protocol.hypothesis}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </details>
      </div>
    </div>
  )
}
