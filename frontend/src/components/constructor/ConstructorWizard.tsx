import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { api } from '@/lib/api'
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import StepProblem from './StepProblem'
import StepQuestion from './StepQuestion'
import StepObjectives from './StepObjectives'
import StepVariables from './StepVariables'
import StepDesign from './StepDesign'
import StepSample from './StepSample'
import StepInstruments from './StepInstruments'
import CoherenceMap from './CoherenceMap'
import type { Protocol, Session, ApiResponse } from '@/types'

interface ConstructorWizardProps {
  sessionId: number
}

const STEPS = [
  { number: 1, name: 'Problema' },
  { number: 2, name: 'Pregunta' },
  { number: 3, name: 'Objetivos' },
  { number: 4, name: 'Variables' },
  { number: 5, name: 'Diseno' },
  { number: 6, name: 'Muestra' },
  { number: 7, name: 'Instrumentos' },
]

export default function ConstructorWizard({ sessionId }: ConstructorWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showCoherenceMap, setShowCoherenceMap] = useState(false)

  useEffect(() => {
    loadData()
  }, [sessionId])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      // Cargar sesion
      const sessionRes = await api.get<ApiResponse<Session>>(`/sessions/${sessionId}`)
      setSession(sessionRes.data)

      // Intentar cargar protocolo existente o crear uno nuevo
      try {
        const protocolRes = await api.get<ApiResponse<Protocol>>(
          `/sessions/${sessionId}/protocol`
        )
        setProtocol(protocolRes.data)
        setCurrentStep(protocolRes.data.current_step || 1)
      } catch {
        // No existe, crear uno nuevo
        const newProtocol = await api.post<ApiResponse<Protocol>>('/protocols', {
          session_id: sessionId,
        })
        setProtocol((newProtocol.data as any)?.protocol ?? newProtocol.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos de la sesion')
    } finally {
      setLoading(false)
    }
  }

  async function saveProgress(stepData?: Partial<Protocol>) {
    if (!protocol) return
    setSaving(true)
    try {
      const dataToSave = {
        ...stepData,
        current_step: currentStep,
      }
      const result = await api.put<ApiResponse<Protocol>>(
        `/protocols/${protocol.id}`,
        dataToSave
      )
      setProtocol(result.data)
      setSaveError(null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function handleUpdate(data: Partial<Protocol>) {
    if (!protocol) return
    setProtocol({ ...protocol, ...data })
  }

  async function goToStep(step: number) {
    if (step < 1 || step > 7) return
    await saveProgress({ current_step: step })
    setCurrentStep(step)
  }

  async function handleNext() {
    if (currentStep === 7) {
      await saveProgress({ current_step: 7 })
      setShowCoherenceMap(true)
      return
    }
    await goToStep(currentStep + 1)
  }

  async function handlePrevious() {
    if (showCoherenceMap) {
      setShowCoherenceMap(false)
      return
    }
    await goToStep(currentStep - 1)
  }

  function handleSubmit() {
    // Protocolo enviado
    loadData()
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-8">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (error || !protocol || !session) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertCircle className="size-10 text-destructive" />
        <p className="text-destructive text-sm font-medium">{error || 'No se pudo cargar el protocolo.'}</p>
        <Button variant="outline" onClick={loadData}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      {/* Stepper horizontal */}
      {!showCoherenceMap && (
        <nav className="relative">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isActive = step.number === currentStep
              const isCompleted = step.number < currentStep
              const isLast = index === STEPS.length - 1

              return (
                <div key={step.number} className="flex items-center flex-1 last:flex-none min-w-0">
                  {/* Indicador del paso */}
                  <button
                    type="button"
                    onClick={() => goToStep(step.number)}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div
                      className={`flex size-8 sm:size-10 items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                        isActive
                          ? 'bg-primary text-white shadow-md shadow-primary/25 scale-110'
                          : isCompleted
                            ? 'bg-success text-white'
                            : 'bg-secondary text-muted group-hover:bg-secondary/80'
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium hidden sm:block ${
                        isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted'
                      }`}
                    >
                      {step.name}
                    </span>
                  </button>

                  {/* Linea de conexion */}
                  {!isLast && (
                    <div className="flex-1 mx-0.5 sm:mx-2 mt-[-1.25rem] sm:mt-[-0.5rem]">
                      <div
                        className={`h-0.5 rounded-full transition-colors duration-300 ${
                          isCompleted ? 'bg-success' : 'bg-border'
                        }`}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>
      )}

      {/* Contenido del paso */}
      <div className="min-h-[400px]">
        {showCoherenceMap ? (
          <CoherenceMap protocol={protocol} onSubmit={handleSubmit} />
        ) : (
          <>
            {currentStep === 1 && (
              <StepProblem
                protocol={protocol}
                onUpdate={handleUpdate}
                problemScenario={session.problem_statement}
              />
            )}
            {currentStep === 2 && (
              <StepQuestion protocol={protocol} onUpdate={handleUpdate} />
            )}
            {currentStep === 3 && (
              <StepObjectives protocol={protocol} onUpdate={handleUpdate} />
            )}
            {currentStep === 4 && (
              <StepVariables protocol={protocol} onUpdate={handleUpdate} />
            )}
            {currentStep === 5 && (
              <StepDesign protocol={protocol} onUpdate={handleUpdate} />
            )}
            {currentStep === 6 && (
              <StepSample protocol={protocol} onUpdate={handleUpdate} />
            )}
            {currentStep === 7 && (
              <StepInstruments protocol={protocol} onUpdate={handleUpdate} />
            )}
          </>
        )}
      </div>

      {/* Navegacion */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1 && !showCoherenceMap}
          className="gap-2"
        >
          <ChevronLeft className="size-4" />
          {showCoherenceMap ? 'Volver al paso 7' : 'Anterior'}
        </Button>

        <div className="flex items-center gap-3">
          {saving && (
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Loader2 className="size-3 animate-spin" />
              Guardando...
            </span>
          )}
          {saveError && !saving && (
            <span className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="size-3" />
              {saveError}
            </span>
          )}
          {!showCoherenceMap && (
            <span className="text-sm text-muted">
              Paso {currentStep} de {STEPS.length}
            </span>
          )}
        </div>

        {!showCoherenceMap && (
          <Button onClick={handleNext} className="gap-2">
            {currentStep === 7 ? 'Ver Mapa de Coherencia' : 'Siguiente'}
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
