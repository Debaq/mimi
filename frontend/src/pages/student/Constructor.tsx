import { useParams, Link, useLocation } from 'react-router-dom'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSessionQuery } from '@/hooks/useSessions'
import ConstructorWizard from '@/components/constructor/ConstructorWizard'

export default function Constructor() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const location = useLocation()
  const id = sessionId ? Number(sessionId) : undefined
  const { data: session, isLoading } = useSessionQuery(id)

  const isTeacherPreview = location.pathname.startsWith('/teacher/')
  const backLink = isTeacherPreview ? `/teacher/sessions/${id}` : '/sessions'
  const backLabel = isTeacherPreview ? 'Volver a la sesion' : 'Volver a sesiones'

  if (!id || isNaN(id)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertCircle className="size-10 text-destructive" />
        <p className="text-destructive text-sm font-medium">ID de sesion invalido</p>
        <Link to={backLink}>
          <Button variant="outline">Volver</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link to={backLink} className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
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
            {isTeacherPreview && <span className="text-base font-normal text-muted ml-2">(Vista previa)</span>}
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

      <ConstructorWizard sessionId={id} />
    </div>
  )
}
