import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import {
  BookOpen,
  Search,
  FlaskConical,
  Calendar,
  Users,
  ArrowRight,
} from 'lucide-react'
import type { Session } from '@/types'

interface SessionCardProps {
  session: Session
  role?: 'estudiante' | 'docente'
  progress?: number
  onClick?: () => void
}

const MODE_CONFIG: Record<
  Session['mode'],
  { icon: React.ElementType; color: string; bg: string }
> = {
  constructor: { icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10' },
  detective: { icon: Search, color: 'text-warning', bg: 'bg-warning/10' },
  laboratorio: { icon: FlaskConical, color: 'text-success', bg: 'bg-success/10' },
}

const STATUS_VARIANT: Record<Session['status'], 'default' | 'success' | 'secondary'> = {
  activa: 'success',
  borrador: 'secondary',
  cerrada: 'secondary',
}

const DIFFICULTY_COLORS: Record<Session['difficulty'], string> = {
  basico: 'text-success',
  intermedio: 'text-warning',
  avanzado: 'text-destructive',
}

export default function SessionCard({ session, role, progress, onClick }: SessionCardProps) {
  const modeConfig = MODE_CONFIG[session.mode]
  const ModeIcon = modeConfig.icon

  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20 group"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          {/* Icono del modo */}
          <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${modeConfig.bg}`}>
            <ModeIcon className={`size-5 ${modeConfig.color}`} />
          </div>

          {/* Status badge */}
          <Badge variant={STATUS_VARIANT[session.status]} className="text-xs shrink-0">
            {session.status}
          </Badge>
        </div>

        {/* Titulo y descripcion */}
        <div className="mt-4 space-y-1.5">
          <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {session.title}
          </h3>
          <p className="text-sm text-muted line-clamp-2">{session.description}</p>
        </div>

        {/* Metadatos */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
          <Badge variant="secondary" className="text-xs">
            {session.mode}
          </Badge>
          <span className={DIFFICULTY_COLORS[session.difficulty]}>
            {session.difficulty}
          </span>
          {session.start_date && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {new Date(session.start_date).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          )}
        </div>

        {/* Info contextual segun rol */}
        <div className="mt-4">
          {role === 'docente' && session.student_count !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted">
                <Users className="size-3.5" />
                {session.student_count} estudiantes
              </span>
              <ArrowRight className="size-4 text-muted group-hover:text-primary transition-colors" />
            </div>
          )}

          {role === 'estudiante' && progress !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Progreso</span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <Progress value={progress} color="primary" height="sm" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
