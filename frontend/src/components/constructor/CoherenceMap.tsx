import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'
import { api } from '@/lib/api'
import { exportProtocolToPDF } from '@/lib/exportProtocol'
import { toast } from '@/components/ui/Toast'
import {
  Network,
  Download,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  HelpCircle,
  AlertCircle,
  Target,
  Variable,
  Compass,
  Users,
  ClipboardList,
} from 'lucide-react'
import type { Protocol, Validation, ApiResponse } from '@/types'

interface CoherenceMapProps {
  protocol: Protocol
  onSubmit: () => void
}

interface Connection {
  from: string
  to: string
  coherent: boolean
  label: string
}

const STEPS_META = [
  { key: 'question', label: 'Pregunta', icon: HelpCircle, color: 'bg-primary' },
  { key: 'objectives', label: 'Objetivos', icon: Target, color: 'bg-accent' },
  { key: 'variables', label: 'Variables', icon: Variable, color: 'bg-warning' },
  { key: 'design', label: 'Diseno', icon: Compass, color: 'bg-success' },
  { key: 'sample', label: 'Muestra', icon: Users, color: 'bg-secondary' },
  { key: 'instruments', label: 'Instrumentos', icon: ClipboardList, color: 'bg-destructive' },
]

export default function CoherenceMap({ protocol, onSubmit }: CoherenceMapProps) {
  const [validations, setValidations] = useState<Validation[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    validateProtocol()
  }, [protocol.id])

  async function validateProtocol() {
    setLoading(true)
    setError(null)
    try {
      const result = await api.post<ApiResponse<{ validations: Validation[] }>>(
        `/protocols/${protocol.id}/validate`
      )
      setValidations(result.data.validations ?? result.data as unknown as Validation[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al validar el protocolo')
    } finally {
      setLoading(false)
    }
  }

  // Helper para verificar si un grupo de campos tiene incoherencias
  function hasIncoherence(...fields: string[]): boolean {
    return validations.some(
      (v) => fields.includes(v.field) && v.status === 'incoherente'
    )
  }

  // Generar conexiones basadas en validaciones
  function getConnections(): Connection[] {
    const connections: Connection[] = [
      {
        from: 'question',
        to: 'objectives',
        coherent: !hasIncoherence('general_objective', 'specific_objectives'),
        label: 'Coherencia',
      },
      {
        from: 'objectives',
        to: 'variables',
        coherent: !hasIncoherence('variables'),
        label: 'Alineacion',
      },
      {
        from: 'variables',
        to: 'design',
        coherent: !hasIncoherence('research_design'),
        label: 'Adecuacion',
      },
      {
        from: 'design',
        to: 'sample',
        coherent: !hasIncoherence('sample'),
        label: 'Congruencia',
      },
      {
        from: 'sample',
        to: 'instruments',
        coherent: !hasIncoherence('instruments'),
        label: 'Cobertura',
      },
    ]
    return connections
  }

  const connections = getConnections()
  const coherentCount = connections.filter((c) => c.coherent).length
  const totalConnections = connections.length
  const coherenceScore = Math.round((coherentCount / totalConnections) * 100)

  const scoreColor =
    coherenceScore >= 80 ? 'text-success' : coherenceScore >= 50 ? 'text-warning' : 'text-destructive'
  const scoreVariant =
    coherenceScore >= 80 ? 'success' : coherenceScore >= 50 ? 'outline' : 'destructive'

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await api.post(`/protocols/${protocol.id}/submit`)
      toast('success', 'Protocolo enviado para revision')
      onSubmit()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al enviar el protocolo')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-muted text-sm">Analizando coherencia del protocolo...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Titulo */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Network className="size-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Mapa de Coherencia</h2>
        </div>
        <p className="text-muted text-sm max-w-md mx-auto">
          Visualizacion de las conexiones logicas entre los elementos de tu protocolo de investigacion.
        </p>
      </div>

      {/* Puntaje general */}
      <Card className="max-w-sm mx-auto text-center">
        <CardContent className="pt-6">
          <p className={`text-5xl font-bold ${scoreColor}`}>{coherenceScore}%</p>
          <p className="text-sm text-muted mt-2">Puntaje de Coherencia</p>
          <Badge variant={scoreVariant as 'success' | 'outline' | 'destructive'} className="mt-3">
            {coherenceScore >= 80
              ? 'Protocolo coherente'
              : coherenceScore >= 50
                ? 'Necesita ajustes'
                : 'Requiere revision'}
          </Badge>
        </CardContent>
      </Card>

      {/* Diagrama visual */}
      <div ref={containerRef} className="relative mx-auto max-w-3xl">
        <div className="flex flex-col gap-0">
          {STEPS_META.map((step, index) => {
            const Icon = step.icon
            const connection = index < connections.length ? connections[index] : null

            return (
              <div key={step.key}>
                {/* Nodo */}
                <div className="flex items-center gap-4">
                  <div
                    className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${step.color} text-white shadow-sm`}
                  >
                    <Icon className="size-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{step.label}</p>
                    <p className="text-xs text-muted">
                      {step.key === 'question' && (protocol.research_question ? 'Definida' : 'Pendiente')}
                      {step.key === 'objectives' &&
                        `${protocol.specific_objectives?.filter(Boolean).length || 0} objetivos especificos`}
                      {step.key === 'variables' && `${protocol.variables?.length || 0} variables`}
                      {step.key === 'design' && (protocol.research_design?.type || 'Pendiente')}
                      {step.key === 'sample' &&
                        (protocol.sample?.size ? `n = ${protocol.sample.size}` : 'Pendiente')}
                      {step.key === 'instruments' &&
                        `${protocol.instruments?.length || 0} instrumentos`}
                    </p>
                  </div>
                </div>

                {/* Conexion (flecha) */}
                {connection && (
                  <div className="flex items-center gap-4 py-2">
                    <div className="flex size-12 shrink-0 items-center justify-center">
                      <div
                        className={`h-8 w-0.5 ${
                          connection.coherent ? 'bg-success' : 'bg-destructive'
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {connection.coherent ? (
                        <CheckCircle className="size-4 text-success" />
                      ) : (
                        <XCircle className="size-4 text-destructive" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          connection.coherent ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {connection.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Detalles de validacion */}
      {validations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalles de la validacion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {validations.map((v) => (
                <div
                  key={v.id}
                  className={`flex items-start gap-3 rounded-lg p-3 ${
                    v.status === 'valido'
                      ? 'bg-success/5'
                      : v.status === 'incompleto'
                        ? 'bg-warning/5'
                        : 'bg-destructive/5'
                  }`}
                >
                  {v.status === 'valido' ? (
                    <CheckCircle className="size-4 mt-0.5 text-success shrink-0" />
                  ) : v.status === 'incompleto' ? (
                    <HelpCircle className="size-4 mt-0.5 text-warning shrink-0" />
                  ) : (
                    <XCircle className="size-4 mt-0.5 text-destructive shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{v.field}</p>
                    <p className="text-xs text-muted">{v.message}</p>
                    {v.suggestion && (
                      <p className="text-xs text-primary mt-1">{v.suggestion}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Errores */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}
      {submitError && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {submitError}
        </div>
      )}

      {/* Botones de accion */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button variant="outline" className="gap-2" onClick={() => exportProtocolToPDF(protocol)}>
          <Download className="size-4" />
          Exportar protocolo
        </Button>
        <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Enviar para revision
        </Button>
      </div>
    </div>
  )
}
