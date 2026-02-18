import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Search,
  Play,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react'
import { Pagination, usePagination } from '@/components/ui/Pagination'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useSessionsQuery } from '@/hooks/useSessions'
import { cn } from '@/lib/utils'

type StatusFilter = 'todas' | 'activa' | 'cerrada'

const filterOptions: { value: StatusFilter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'activa', label: 'Activas' },
  { value: 'cerrada', label: 'Completadas' },
]

export default function StudentSessions() {
  const { data: sessions, isLoading } = useSessionsQuery()
  const [filter, setFilter] = useState<StatusFilter>('todas')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = (sessions ?? []).filter((s) => {
    if (filter !== 'todas' && s.status !== filter) return false
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const { totalPages, paginate } = usePagination(filtered, 9)
  const paginated = paginate(page)

  const filterKey = `${filter}-${search}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    if (page !== 1) setPage(1)
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'activa':
        return <Badge variant="success">Activa</Badge>
      case 'cerrada':
        return <Badge variant="secondary">Completada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  function getModeLabel(mode: string) {
    switch (mode) {
      case 'constructor':
        return 'Constructor'
      case 'detective':
        return 'Detective'
      case 'laboratorio':
        return 'Laboratorio'
      default:
        return mode
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Mis Sesiones</h1>
        <p className="mt-1 text-muted">
          Explora y continua tus sesiones de investigacion.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted" />
          <div className="flex gap-1 rounded-xl bg-secondary p-1">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-sm font-medium transition-all',
                  filter === opt.value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Buscar sesion..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Session grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No se encontraron sesiones
          </h3>
          <p className="mt-1 text-sm text-muted">
            {search
              ? 'Intenta con otro termino de busqueda.'
              : 'Aun no tienes sesiones asignadas.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((session) => (
            <Card
              key={session.id}
              className="group border-border/50 transition-all hover:shadow-md"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    {session.status === 'activa' ? (
                      <Play className="h-5 w-5 text-primary" />
                    ) : session.status === 'cerrada' ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted" />
                    )}
                  </div>
                  {getStatusBadge(session.status)}
                </div>

                <h3 className="text-base font-semibold text-foreground mb-1">
                  {session.title}
                </h3>
                <p className="text-sm text-muted line-clamp-2 mb-4">
                  {session.description || 'Sin descripcion'}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      {getModeLabel(session.mode)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {session.difficulty}
                    </Badge>
                  </div>

                  {session.status === 'activa' && (
                    <Link to={`/constructor/${session.id}`}>
                      <Button size="sm">
                        Continuar
                      </Button>
                    </Link>
                  )}
                </div>

                {session.teacher_name && (
                  <p className="mt-3 text-xs text-muted">
                    Docente: {session.teacher_name}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  )
}
