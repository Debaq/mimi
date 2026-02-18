import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Separator } from '@/components/ui/Separator'
import VideoPlayer from './VideoPlayer'
import { api } from '@/lib/api'
import {
  Search,
  Video,
  BookOpen,
  FileText,
  BookMarked,
  X,
  FolderOpen,
} from 'lucide-react'
import type { Resource, ApiResponse } from '@/types'

interface ResourceLibraryProps {
  className?: string
}

const TYPE_ICONS: Record<Resource['type'], React.ElementType> = {
  video: Video,
  referencia: BookOpen,
  plantilla: FileText,
  glosario: BookMarked,
}

const TYPE_LABELS: Record<Resource['type'], string> = {
  video: 'Video',
  referencia: 'Referencia',
  plantilla: 'Plantilla',
  glosario: 'Glosario',
}

const CATEGORY_LABELS: Record<Resource['category'], string> = {
  conceptual: 'Conceptual',
  procedimental: 'Procedimental',
  caso_resuelto: 'Caso resuelto',
}

export default function ResourceLibrary({ className = '' }: ResourceLibraryProps) {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    loadResources()
  }, [])

  async function loadResources() {
    setLoading(true)
    try {
      const result = await api.get<ApiResponse<Resource[]>>('/resources')
      setResources(result.data)
    } catch {
      // Error silencioso
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      const matchesSearch =
        !search ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.keywords.toLowerCase().includes(search.toLowerCase())
      const matchesType = filterType === 'all' || r.type === filterType
      const matchesCategory = filterCategory === 'all' || r.category === filterCategory
      return matchesSearch && matchesType && matchesCategory
    })
  }, [resources, search, filterType, filterCategory])

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar recursos por titulo o palabras clave..."
            className="pl-10"
          />
        </div>
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full sm:w-36"
        >
          <SelectOption value="all">Todos los tipos</SelectOption>
          <SelectOption value="video">Video</SelectOption>
          <SelectOption value="referencia">Referencia</SelectOption>
          <SelectOption value="plantilla">Plantilla</SelectOption>
          <SelectOption value="glosario">Glosario</SelectOption>
        </Select>
        <Select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full sm:w-36"
        >
          <SelectOption value="all">Todas las categorias</SelectOption>
          <SelectOption value="conceptual">Conceptual</SelectOption>
          <SelectOption value="procedimental">Procedimental</SelectOption>
          <SelectOption value="caso_resuelto">Caso resuelto</SelectOption>
        </Select>
      </div>

      {/* Resultados */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <FolderOpen className="size-12 text-muted" />
          <div className="text-center">
            <p className="font-medium text-foreground">No se encontraron recursos</p>
            <p className="text-sm text-muted mt-1">Intenta ajustar los filtros de busqueda.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((resource) => {
            const TypeIcon = TYPE_ICONS[resource.type]
            const isExpanded = expandedId === resource.id

            return (
              <Card
                key={resource.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isExpanded ? 'sm:col-span-2 lg:col-span-3' : ''
                }`}
                onClick={() => setExpandedId(isExpanded ? null : resource.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                        <TypeIcon className="size-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm line-clamp-1">
                          {resource.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px]">
                            {TYPE_LABELS[resource.type]}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {CATEGORY_LABELS[resource.category]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedId(null)
                        }}
                      >
                        <X className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    <Separator className="mb-4" />
                    {resource.type === 'video' ? (
                      <VideoPlayer url={resource.content} title={resource.title} />
                    ) : (
                      <div className="prose prose-sm max-w-none text-foreground">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {resource.content}
                        </p>
                      </div>
                    )}
                    {resource.keywords && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {resource.keywords.split(',').map((kw, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {kw.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted mt-3">
                      Nivel minimo requerido: {resource.min_level}
                    </p>
                  </CardContent>
                )}

                {!isExpanded && (
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted line-clamp-2">
                      {resource.content.substring(0, 120)}
                      {resource.content.length > 120 ? '...' : ''}
                    </p>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
