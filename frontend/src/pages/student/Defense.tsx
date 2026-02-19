import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useProtocolQuery } from '@/hooks/useProtocol'
import {
  useDefensesByProtocol,
  useStartDefense,
} from '@/hooks/useDefense'
import { toast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import DefenseArena from '@/components/defense/DefenseArena'
import DefenseResults from '@/components/defense/DefenseResults'
import type { DefenseSession } from '@/types'
import {
  Shield,
  Clock,
  Trophy,
  AlertCircle,
  ChevronRight,
  History,
} from 'lucide-react'

export default function Defense() {
  const { protocolId } = useParams<{ protocolId: string }>()
  const numericProtocolId = protocolId ? parseInt(protocolId, 10) : undefined

  const { data: protocol, isLoading: protocolLoading } =
    useProtocolQuery(numericProtocolId)
  const { data: defenseSessions, isLoading: defensesLoading } =
    useDefensesByProtocol(numericProtocolId)
  const startDefense = useStartDefense()

  const [activeSession, setActiveSession] = useState<DefenseSession | null>(
    null
  )
  const [showResults, setShowResults] = useState<DefenseSession | null>(null)

  const isLoading = protocolLoading || defensesLoading

  // Buscar defensa en curso
  const activeDefense = defenseSessions?.find(
    (s) => s.status === 'en_curso'
  )
  const completedDefenses =
    defenseSessions?.filter((s) => s.status === 'completada') || []

  const handleStartDefense = async () => {
    if (!numericProtocolId) return

    try {
      const response = await startDefense.mutateAsync(numericProtocolId)
      setActiveSession(response.data)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error al iniciar la defensa'
      toast('error', errorMessage)
    }
  }

  const handleDefenseComplete = (session: DefenseSession, xpEarned: number) => {
    setActiveSession(null)
    setShowResults({ ...session, overall_score: session.overall_score })
    toast(
      'success',
      `Defensa completada. Ganaste ${xpEarned} XP!`
    )
  }

  const handleBackToList = () => {
    setShowResults(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!protocol) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="size-12 mx-auto text-muted mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Protocolo no encontrado
            </h2>
            <p className="text-muted">
              El protocolo que buscas no existe o no tienes acceso.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Si el protocolo no esta en estado valido
  if (!['enviado', 'aprobado'].includes(protocol.status)) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="size-12 mx-auto text-warning mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Protocolo no disponible para defensa
            </h2>
            <p className="text-muted">
              Tu protocolo debe estar en estado "enviado" o "aprobado" para
              iniciar una defensa simulada.
            </p>
            <Badge variant="outline" className="mt-3">
              Estado actual: {protocol.status}
            </Badge>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Si hay una defensa activa (de BD o recien creada)
  if (activeSession || activeDefense) {
    return (
      <DefenseArena
        session={activeSession || activeDefense!}
        protocol={protocol}
        onComplete={handleDefenseComplete}
      />
    )
  }

  // Si estamos viendo resultados
  if (showResults) {
    return (
      <DefenseResults
        session={showResults}
        onRetry={handleStartDefense}
        onBack={handleBackToList}
      />
    )
  }

  // Vista principal: iniciar defensa o ver historial
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Shield className="size-7 text-primary" />
          Simulador de Defensa
        </h1>
        <p className="text-muted mt-1">
          Practica la defensa de tu protocolo de investigacion frente a un
          jurado simulado.
        </p>
      </div>

      {/* Iniciar defensa */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            Iniciar Defensa Simulada
          </CardTitle>
          <CardDescription>
            Enfrenta un jurado simulado que te hara 5 preguntas sobre tu
            protocolo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Clock className="size-4 text-primary" />
              <span>30 minutos de limite</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <AlertCircle className="size-4 text-primary" />
              <span>5 preguntas del jurado</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Trophy className="size-4 text-primary" />
              <span>Hasta 200 XP</span>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 space-y-2">
            <h4 className="font-medium text-sm">Como funciona:</h4>
            <ul className="text-sm text-muted space-y-1.5">
              <li className="flex items-start gap-2">
                <ChevronRight className="size-4 mt-0.5 text-primary shrink-0" />
                Un panel de 3 sinodales te hara preguntas sobre tu protocolo
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="size-4 mt-0.5 text-primary shrink-0" />
                Las preguntas cubren fundamentacion, metodologia, muestra,
                instrumentos y coherencia
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="size-4 mt-0.5 text-primary shrink-0" />
                Responde cada pregunta de forma clara y argumentada
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="size-4 mt-0.5 text-primary shrink-0" />
                Al finalizar recibiras un puntaje y retroalimentacion por
                categoria
              </li>
            </ul>
          </div>

          <Button
            size="lg"
            onClick={handleStartDefense}
            disabled={startDefense.isPending}
            className="w-full"
          >
            {startDefense.isPending ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Preparando defensa...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Shield className="size-5" />
                Iniciar Defensa
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Historial de defensas */}
      {completedDefenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="size-5 text-muted" />
              Historial de Defensas
            </CardTitle>
            <CardDescription>
              Tus defensas completadas anteriormente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedDefenses.map((defense) => (
                <button
                  key={defense.id}
                  onClick={() => setShowResults(defense)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                        defense.overall_score >= 70
                          ? 'bg-success'
                          : defense.overall_score >= 50
                            ? 'bg-warning'
                            : 'bg-destructive'
                      }`}
                    >
                      {defense.overall_score}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        Defensa #{defense.id}
                      </p>
                      <p className="text-xs text-muted">
                        {defense.completed_at
                          ? new Date(
                              defense.completed_at
                            ).toLocaleDateString('es-MX', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Sin fecha'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        defense.overall_score >= 70
                          ? 'success'
                          : defense.overall_score >= 50
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {defense.overall_score >= 70
                        ? 'Aprobada'
                        : defense.overall_score >= 50
                          ? 'Regular'
                          : 'Por mejorar'}
                    </Badge>
                    <ChevronRight className="size-4 text-muted" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
