import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  BookOpen,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Eye,
} from 'lucide-react'
import { Pagination, usePagination } from '@/components/ui/Pagination'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useSessionsQuery } from '@/hooks/useSessions'
import { cn } from '@/lib/utils'
import type { Session } from '@/types'

type StatusFilter = 'todas' | Session['status']

const filterOptions: { value: StatusFilter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'activa', label: 'Activas' },
  { value: 'borrador', label: 'Borradores' },
  { value: 'cerrada', label: 'Cerradas' },
]

export default function TeacherSessions() {
  const { data: sessions, isLoading } = useSessionsQuery()
  const [filter, setFilter] = useState<StatusFilter>('todas')
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const filtered = (sessions ?? []).filter((s) => {
    if (filter !== 'todas' && s.status !== filter) return false
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const { totalPages, paginate } = usePagination(filtered, 10)
  const paginated = paginate(page)

  const filterKey = `${filter}-${search}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    if (page !== 1) setPage(1)
  }

  function getStatusBadge(status: Session['status']) {
    switch (status) {
      case 'activa':
        return <Badge variant="success">Activa</Badge>
      case 'borrador':
        return <Badge variant="secondary">Borrador</Badge>
      case 'cerrada':
        return <Badge variant="outline">Cerrada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  function getModeLabel(mode: Session['mode']) {
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Mis Sesiones
          </h1>
          <p className="mt-1 text-muted">
            Gestiona tus sesiones de investigacion.
          </p>
        </div>
        <Link to="/teacher/sessions/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nueva Sesion
          </Button>
        </Link>
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

      {/* Session list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />
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
              : 'Crea tu primera sesion para comenzar.'}
          </p>
          {!search && (
            <Link to="/teacher/sessions/new" className="mt-4 inline-block">
              <Button>
                <Plus className="h-4 w-4" />
                Crear Sesion
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((session) => (
            <Card key={session.id} className="border-border/50 hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/teacher/sessions/${session.id}`}
                          className="text-base font-semibold text-foreground hover:text-primary transition-colors truncate"
                        >
                          {session.title}
                        </Link>
                        {getStatusBadge(session.status)}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {session.student_count ?? 0} estudiantes
                        </span>
                        <span>&middot;</span>
                        <span>{getModeLabel(session.mode)}</span>
                        <span>&middot;</span>
                        <span className="capitalize">{session.difficulty}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="relative ml-4 shrink-0">
                    <button
                      onClick={() => setMenuOpen(menuOpen === session.id ? null : session.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {menuOpen === session.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                        <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-border bg-card p-1 shadow-lg">
                          <Link
                            to={`/teacher/sessions/${session.id}`}
                            onClick={() => setMenuOpen(null)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                          >
                            <Eye className="h-4 w-4 text-muted" />
                            Ver detalle
                          </Link>
                          <button
                            onClick={() => setMenuOpen(null)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                          >
                            <Edit className="h-4 w-4 text-muted" />
                            Editar
                          </button>
                          <div className="my-1 h-px bg-border" />
                          <button
                            onClick={() => setMenuOpen(null)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-secondary transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
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
