import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  BookOpen,
  Filter,
  Users,
  Eye,
  Trash2,
  Play,
  X,
} from 'lucide-react'
import { Pagination, usePagination } from '@/components/ui/Pagination'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useSessionsQuery, useDeleteSession, useUpdateSession } from '@/hooks/useSessions'
import { toast } from '@/components/ui/Toast'
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
  const deleteSession = useDeleteSession()
  const updateSession = useUpdateSession()
  const [filter, setFilter] = useState<StatusFilter>('todas')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Eliminar la sesion "${title}"? Esta accion no se puede deshacer.`)) return
    try {
      await deleteSession.mutateAsync(id)
      toast('success', 'Sesion eliminada')
    } catch {
      toast('error', 'Error al eliminar la sesion')
    }
  }

  async function handleToggleStatus(id: number, currentStatus: string) {
    const newStatus = currentStatus === 'activa' ? 'cerrada' : 'activa'
    try {
      await updateSession.mutateAsync({ id, status: newStatus })
      toast('success', newStatus === 'activa' ? 'Sesion publicada' : 'Sesion cerrada')
    } catch {
      toast('error', 'Error al cambiar el estado')
    }
  }

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

                  <div className="ml-4 shrink-0 flex items-center gap-1">
                    {session.status === 'borrador' && (
                      <button
                        onClick={() => handleToggleStatus(session.id, session.status)}
                        disabled={updateSession.isPending}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-success hover:bg-success/10 transition-colors"
                        title="Publicar"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    {session.status === 'activa' && (
                      <button
                        onClick={() => handleToggleStatus(session.id, session.status)}
                        disabled={updateSession.isPending}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-secondary hover:text-foreground transition-colors"
                        title="Cerrar sesion"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <Link
                      to={`/teacher/sessions/${session.id}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-secondary hover:text-foreground transition-colors"
                      title="Ver detalle"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(session.id, session.title)}
                      disabled={deleteSession.isPending}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-destructive/60 hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
