import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useSessionQuery } from '@/hooks/useSessions'

export default function Constructor() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const id = sessionId ? Number(sessionId) : undefined
  const { data: session, isLoading } = useSessionQuery(id)

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link to="/sessions" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors">
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
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Constructor de Protocolos
          </h1>
          {session && (
            <p className="mt-1 text-muted">
              Sesion: {session.title} &middot;{' '}
              {session.mode === 'constructor'
                ? 'Constructor'
                : session.mode === 'detective'
                  ? 'Detective'
                  : 'Laboratorio'}
            </p>
          )}
        </div>
      )}

      {/* Placeholder for ConstructorWizard */}
      <Card className="border-border/50 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Constructor de Protocolos - Sesion {sessionId}
          </h2>
          <p className="text-sm text-muted text-center max-w-md">
            El asistente de construccion de protocolos se cargara aqui. Este componente
            guiara paso a paso la creacion del protocolo de investigacion.
          </p>
          {session?.problem_statement && (
            <div className="mt-6 w-full max-w-lg rounded-xl bg-secondary/50 p-4">
              <p className="text-xs font-medium text-muted mb-1">Planteamiento del problema:</p>
              <p className="text-sm text-foreground">{session.problem_statement}</p>
            </div>
          )}
          <Link to="/sessions" className="mt-6">
            <Button variant="outline">Volver a Sesiones</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
