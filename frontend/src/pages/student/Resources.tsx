import { useState } from 'react'
import {
  Search,
  Filter,
  Video,
  BookOpen,
  FileText,
  BookMarked,
  FolderOpen,
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Pagination, usePagination } from '@/components/ui/Pagination'
import { cn } from '@/lib/utils'
import type { Resource } from '@/types'
import { api } from '@/lib/api'
import type { ApiResponse } from '@/types'
import { useQuery } from '@tanstack/react-query'

function useResourcesQuery() {
  return useQuery({
    queryKey: ['resources'],
    queryFn: () => api.get<ApiResponse<Resource[]>>('/resources'),
    select: (data) => data.data,
  })
}

type TypeFilter = 'todas' | Resource['type']
type CategoryFilter = 'todas' | Resource['category']

const typeOptions: { value: TypeFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'todas', label: 'Todos', icon: FolderOpen },
  { value: 'video', label: 'Videos', icon: Video },
  { value: 'referencia', label: 'Referencias', icon: BookOpen },
  { value: 'plantilla', label: 'Plantillas', icon: FileText },
  { value: 'glosario', label: 'Glosario', icon: BookMarked },
]

const categoryOptions: { value: CategoryFilter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'conceptual', label: 'Conceptual' },
  { value: 'procedimental', label: 'Procedimental' },
  { value: 'caso_resuelto', label: 'Caso Resuelto' },
]

function getTypeIcon(type: Resource['type']) {
  switch (type) {
    case 'video':
      return Video
    case 'referencia':
      return BookOpen
    case 'plantilla':
      return FileText
    case 'glosario':
      return BookMarked
    default:
      return FolderOpen
  }
}

function getTypeColor(type: Resource['type']) {
  switch (type) {
    case 'video':
      return 'bg-destructive/10 text-destructive'
    case 'referencia':
      return 'bg-primary/10 text-primary'
    case 'plantilla':
      return 'bg-success/10 text-success'
    case 'glosario':
      return 'bg-warning/10 text-warning'
    default:
      return 'bg-secondary text-muted'
  }
}

export default function Resources() {
  const { data: resources, isLoading } = useResourcesQuery()
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todas')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('todas')
  const [search, setSearch] = useState('')
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [page, setPage] = useState(1)

  const filtered = (resources ?? []).filter((r) => {
    if (typeFilter !== 'todas' && r.type !== typeFilter) return false
    if (categoryFilter !== 'todas' && r.category !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        r.title.toLowerCase().includes(q) ||
        r.keywords.toLowerCase().includes(q)
      )
    }
    return true
  })

  const { totalPages, paginate } = usePagination(filtered, 9)
  const paginated = paginate(page)

  // Reset page when filters change
  const filterKey = `${typeFilter}-${categoryFilter}-${search}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    if (page !== 1) setPage(1)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Recursos</h1>
        <p className="mt-1 text-muted">
          Materiales de apoyo para tu proceso de investigacion.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Type filter */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted" />
          {typeOptions.map((opt) => {
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                  typeFilter === opt.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-secondary text-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* Category + search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl bg-secondary p-1">
            {categoryOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCategoryFilter(opt.value)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                  categoryFilter === opt.value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Buscar recurso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Resource grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-muted/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No se encontraron recursos
          </h3>
          <p className="mt-1 text-sm text-muted">
            Intenta con otros filtros o terminos de busqueda.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((resource) => {
            const Icon = getTypeIcon(resource.type)
            const colorClasses = getTypeColor(resource.type)
            return (
              <Card
                key={resource.id}
                className="group cursor-pointer border-border/50 transition-all hover:shadow-md"
                onClick={() => setSelectedResource(resource)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', colorClasses)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {resource.category.replace('_', ' ')}
                    </Badge>
                  </div>

                  <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {resource.title}
                  </h3>

                  <p className="text-xs text-muted line-clamp-2 mb-3">
                    {resource.content.slice(0, 120)}...
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {resource.keywords
                        .split(',')
                        .slice(0, 2)
                        .map((kw) => (
                          <span
                            key={kw}
                            className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted"
                          >
                            {kw.trim()}
                          </span>
                        ))}
                    </div>
                    {resource.min_level > 1 && (
                      <span className="text-xs text-muted">
                        Niv. {resource.min_level}+
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Paginacion */}
      {filtered.length > 0 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* Resource detail modal */}
      {selectedResource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4"
          onClick={() => setSelectedResource(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', getTypeColor(selectedResource.type))}>
                  {(() => {
                    const Icon = getTypeIcon(selectedResource.type)
                    return <Icon className="h-6 w-6" />
                  })()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedResource.title}
                  </h2>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs capitalize">
                      {selectedResource.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {selectedResource.category.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedResource(null)}
                className="text-muted hover:text-foreground text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="prose prose-sm max-h-80 overflow-y-auto text-sm text-foreground leading-relaxed">
              <p>{selectedResource.content}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {selectedResource.keywords.split(',').map((kw) => (
                <span
                  key={kw}
                  className="rounded-lg bg-secondary px-2 py-1 text-xs text-muted"
                >
                  {kw.trim()}
                </span>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedResource(null)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-secondary transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
