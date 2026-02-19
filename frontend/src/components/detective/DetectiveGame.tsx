import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Lightbulb,
  Send,
  Clock,
  AlertTriangle,
  FileText,
  Target,
  FlaskConical,
  Users,
  ClipboardList,
  HelpCircle,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectOption } from '@/components/ui/Select'
import { toast } from '@/components/ui/Toast'
import {
  useUpdateDetectiveAnnotations,
  useSubmitDetectiveAttempt,
  useDetectiveHint,
} from '@/hooks/useDetective'
import { cn } from '@/lib/utils'
import type { DetectiveCase, DetectiveAnnotation, DetectiveSubmitResponse } from '@/types'

interface DetectiveGameProps {
  detectiveCase: DetectiveCase
  sessionShowHints: boolean
  onSubmitComplete: (results: DetectiveSubmitResponse) => void
  onBack: () => void
}

const ERROR_TYPES = [
  { value: 'incoherencia', label: 'Incoherencia' },
  { value: 'ausencia', label: 'Ausencia' },
  { value: 'contradiccion', label: 'Contradiccion' },
  { value: 'error_logico', label: 'Error Logico' },
  { value: 'sesgo', label: 'Sesgo' },
]

const SECTION_LABELS: Record<string, { label: string; icon: typeof Search }> = {
  problema: { label: 'Planteamiento del Problema', icon: FileText },
  pregunta: { label: 'Pregunta de Investigacion', icon: HelpCircle },
  objetivo_general: { label: 'Objetivo General', icon: Target },
  objetivos_especificos: { label: 'Objetivos Especificos', icon: ClipboardList },
  hipotesis: { label: 'Hipotesis', icon: BookOpen },
  variables: { label: 'Variables', icon: FlaskConical },
  diseno: { label: 'Diseno Metodologico', icon: FlaskConical },
  muestra: { label: 'Muestra', icon: Users },
  instrumentos: { label: 'Instrumentos', icon: ClipboardList },
}

export default function DetectiveGame({
  detectiveCase,
  sessionShowHints,
  onSubmitComplete,
  onBack,
}: DetectiveGameProps) {
  const attempt = detectiveCase.attempt
  const [annotations, setAnnotations] = useState<DetectiveAnnotation[]>(
    attempt?.annotations ?? []
  )
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [timeSpent, setTimeSpent] = useState(attempt?.time_spent ?? 0)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)

  const updateAnnotations = useUpdateDetectiveAnnotations()
  const submitAttempt = useSubmitDetectiveAttempt()
  const getHint = useDetectiveHint()

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeSpent((prev) => prev + 1)
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Auto-guardar anotaciones cada vez que cambian (con debounce)
  const saveAnnotations = useCallback(
    (anns: DetectiveAnnotation[], time: number) => {
      if (!attempt) return
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

      saveTimeoutRef.current = setTimeout(() => {
        updateAnnotations.mutate({
          attemptId: attempt.id,
          annotations: anns,
          time_spent: time,
        })
      }, 1500)
    },
    [attempt, updateAnnotations]
  )

  useEffect(() => {
    saveAnnotations(annotations, timeSpent)
  }, [annotations]) // eslint-disable-line react-hooks/exhaustive-deps

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  function formatTimeLimit(minutes: number) {
    return `${minutes}:00`
  }

  // Verificar si el tiempo se agoto
  const timeLimit = detectiveCase.time_limit
  const timeExpired = timeLimit > 0 && timeSpent >= timeLimit * 60

  useEffect(() => {
    if (timeExpired && attempt) {
      handleSubmit()
    }
  }, [timeExpired]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleAddAnnotation() {
    if (!selectedField) {
      toast('error', 'Selecciona una seccion del protocolo primero')
      return
    }

    const nextId = `ann_${Date.now()}`
    const newAnnotation: DetectiveAnnotation = {
      field: selectedField,
      error_id: nextId,
      explanation: '',
    }

    setAnnotations((prev) => [...prev, newAnnotation])
  }

  function handleUpdateAnnotation(index: number, updates: Partial<DetectiveAnnotation>) {
    setAnnotations((prev) =>
      prev.map((ann, i) => (i === index ? { ...ann, ...updates } : ann))
    )
  }

  function handleRemoveAnnotation(index: number) {
    setAnnotations((prev) => prev.filter((_, i) => i !== index))
  }

  function handleGetHint() {
    if (!attempt) return

    getHint.mutate(attempt.id, {
      onSuccess: (response) => {
        const data = response.data
        if (data.hint) {
          toast('info', `Pista: ${data.hint.hint} (-${data.score_penalty} pts max)`)
        } else {
          toast('info', 'Ya encontraste todos los errores.')
        }
      },
      onError: (error) => {
        toast('error', error.message || 'Error al obtener pista')
      },
    })
  }

  function handleSubmit() {
    if (!attempt) return

    // Guardar anotaciones finales antes de enviar
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

    updateAnnotations.mutate(
      {
        attemptId: attempt.id,
        annotations,
        time_spent: timeSpent,
      },
      {
        onSuccess: () => {
          submitAttempt.mutate(attempt.id, {
            onSuccess: (response) => {
              if (timerRef.current) clearInterval(timerRef.current)
              toast('success', `Caso evaluado. Puntuacion: ${response.data.score}/100`)
              onSubmitComplete(response.data)
            },
            onError: (error) => {
              toast('error', error.message || 'Error al enviar el intento')
            },
          })
        },
      }
    )
  }

  // Renderizar contenido de una seccion del protocolo
  function renderProtocolSection(key: string, value: unknown) {
    const sectionInfo = SECTION_LABELS[key]
    const label = sectionInfo?.label ?? key
    const Icon = sectionInfo?.icon ?? FileText
    const isSelected = selectedField === key
    const hasAnnotation = annotations.some((ann) => ann.field === key)

    return (
      <div
        key={key}
        onClick={() => setSelectedField(key)}
        className={cn(
          'rounded-xl border p-4 cursor-pointer transition-all',
          isSelected
            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
            : hasAnnotation
              ? 'border-amber-500/50 bg-amber-500/5'
              : 'border-border hover:border-primary/30 hover:bg-secondary/50'
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-muted" />
          <h4 className="text-sm font-semibold text-foreground">{label}</h4>
          {hasAnnotation && (
            <Badge variant="default" className="ml-auto text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Marcado
            </Badge>
          )}
        </div>
        <div className="text-sm text-foreground/80">
          {renderValue(value)}
        </div>
      </div>
    )
  }

  function renderValue(value: unknown): React.ReactNode {
    if (value === null || value === undefined) {
      return <span className="text-muted italic">No definido</span>
    }

    if (typeof value === 'string') {
      return <p className="whitespace-pre-wrap">{value}</p>
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return <p>{String(value)}</p>
    }

    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {value.map((item, i) => (
            <li key={i} className="text-sm">
              {typeof item === 'object' ? renderObjectInline(item) : String(item)}
            </li>
          ))}
        </ul>
      )
    }

    if (typeof value === 'object') {
      return renderObjectBlock(value as Record<string, unknown>)
    }

    return <p>{String(value)}</p>
  }

  function renderObjectInline(obj: Record<string, unknown>): React.ReactNode {
    return (
      <span>
        {Object.entries(obj)
          .map(([k, v]) => `${k}: ${String(v)}`)
          .join(' | ')}
      </span>
    )
  }

  function renderObjectBlock(obj: Record<string, unknown>): React.ReactNode {
    return (
      <div className="space-y-1 pl-2 border-l-2 border-border">
        {Object.entries(obj).map(([k, v]) => (
          <div key={k}>
            <span className="text-xs font-medium text-muted">{k}: </span>
            <span className="text-sm">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
          </div>
        ))}
      </div>
    )
  }

  const protocolData = detectiveCase.protocol_data as Record<string, unknown>
  const protocolSections = Object.keys(protocolData)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              {detectiveCase.title}
            </h1>
            <p className="text-sm text-muted">{detectiveCase.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium',
              timeLimit > 0 && timeSpent >= timeLimit * 60 * 0.8
                ? 'bg-destructive/10 text-destructive'
                : 'bg-secondary text-foreground'
            )}
          >
            <Clock className="h-4 w-4" />
            <span>{formatTime(timeSpent)}</span>
            {timeLimit > 0 && (
              <span className="text-muted"> / {formatTimeLimit(timeLimit)}</span>
            )}
          </div>

          {/* Annotations count */}
          <Badge variant="outline" className="text-sm py-1.5 px-3">
            <Search className="h-3.5 w-3.5 mr-1" />
            {annotations.length} errores marcados
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Protocolo - 2 columnas */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Protocolo de Investigacion
              </CardTitle>
              <p className="text-xs text-muted">
                Haz clic en una seccion para seleccionarla y luego agrega una anotacion de error en el panel derecho.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {protocolSections.map((key) =>
                renderProtocolSection(key, protocolData[key])
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral - Anotaciones */}
        <div className="space-y-4">
          {/* Acciones */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleAddAnnotation}
              disabled={!selectedField}
              className="w-full"
            >
              <Plus className="h-4 w-4" />
              Marcar Error {selectedField ? `en "${SECTION_LABELS[selectedField]?.label ?? selectedField}"` : ''}
            </Button>

            {sessionShowHints && (
              <Button
                variant="outline"
                onClick={handleGetHint}
                disabled={getHint.isPending}
                className="w-full"
              >
                <Lightbulb className="h-4 w-4" />
                {getHint.isPending ? 'Obteniendo pista...' : 'Pedir Pista (-5 pts)'}
              </Button>
            )}
          </div>

          {/* Lista de anotaciones */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Mis Anotaciones ({annotations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {annotations.length === 0 ? (
                <div className="py-8 text-center">
                  <Search className="mx-auto h-8 w-8 text-muted/40" />
                  <p className="mt-2 text-sm text-muted">
                    Selecciona una seccion del protocolo y marca los errores que encuentres.
                  </p>
                </div>
              ) : (
                annotations.map((ann, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-border p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {SECTION_LABELS[ann.field]?.label ?? ann.field}
                      </Badge>
                      <button
                        onClick={() => handleRemoveAnnotation(index)}
                        className="text-muted hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <Select
                      value={ann.error_id.startsWith('ann_') ? '' : ann.error_id}
                      onChange={(e) =>
                        handleUpdateAnnotation(index, { error_id: e.target.value || ann.error_id })
                      }
                    >
                      <SelectOption value="">Tipo de error...</SelectOption>
                      {ERROR_TYPES.map((type) => (
                        <SelectOption key={type.value} value={type.value}>
                          {type.label}
                        </SelectOption>
                      ))}
                    </Select>

                    <Textarea
                      placeholder="Explica por que consideras que hay un error aqui (minimo 20 palabras para mejor puntuacion)..."
                      value={ann.explanation}
                      onChange={(e) =>
                        handleUpdateAnnotation(index, { explanation: e.target.value })
                      }
                      rows={3}
                      className="text-sm"
                    />

                    {ann.explanation && (
                      <p className="text-xs text-muted">
                        {ann.explanation.split(/\s+/).filter(Boolean).length} palabras
                        {ann.explanation.split(/\s+/).filter(Boolean).length < 20 && (
                          <span className="text-amber-500 ml-1">
                            (necesitas al menos 20 para puntuacion completa)
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Boton de enviar */}
          {annotations.length > 0 && (
            <div className="space-y-2">
              {!showConfirmSubmit ? (
                <Button
                  variant="default"
                  onClick={() => setShowConfirmSubmit(true)}
                  className="w-full"
                  disabled={submitAttempt.isPending}
                >
                  <Send className="h-4 w-4" />
                  Enviar Analisis
                </Button>
              ) : (
                <Card className="border-amber-500/50 bg-amber-500/5">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Confirmar envio
                        </p>
                        <p className="text-xs text-muted mt-1">
                          Una vez enviado, no podras modificar tus anotaciones.
                          Tienes {annotations.length} errores marcados.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowConfirmSubmit(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={submitAttempt.isPending}
                        className="flex-1"
                      >
                        {submitAttempt.isPending ? 'Evaluando...' : 'Confirmar'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
