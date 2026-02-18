import { useState } from 'react'
import {
  Plus,
  Search,
  Video,
  BookOpen,
  FileText,
  BookMarked,
  FolderOpen,
  Edit,
  Trash2,
  X,
  Save,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Resource, ApiResponse } from '@/types'

function useResourcesQuery() {
  return useQuery({
    queryKey: ['resources'],
    queryFn: () => api.get<ApiResponse<Resource[]>>('/resources'),
    select: (data) => data.data,
  })
}

function useCreateResource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Resource, 'id'>) =>
      api.post<ApiResponse<Resource>>('/resources', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
    },
  })
}

function useDeleteResource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<ApiResponse<void>>(`/resources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
    },
  })
}

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

const emptyResource = {
  title: '',
  type: 'referencia' as Resource['type'],
  content: '',
  category: 'conceptual' as Resource['category'],
  keywords: '',
  min_level: 1,
}

export default function TeacherLibrary() {
  const { data: resources, isLoading } = useResourcesQuery()
  const createResource = useCreateResource()
  const deleteResource = useDeleteResource()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyResource)
  const [formError, setFormError] = useState('')

  const filtered = (resources ?? []).filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.title.toLowerCase().includes(q) ||
      r.keywords.toLowerCase().includes(q)
    )
  })

  async function handleCreate() {
    setFormError('')
    if (!form.title.trim()) {
      setFormError('El titulo es obligatorio.')
      return
    }
    if (!form.content.trim()) {
      setFormError('El contenido es obligatorio.')
      return
    }

    try {
      await createResource.mutateAsync(form)
      setForm(emptyResource)
      setShowForm(false)
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message)
      } else {
        setFormError('Error al crear el recurso.')
      }
    }
  }

  async function handleDelete(id: number) {
    if (confirm('Estas seguro de que deseas eliminar este recurso?')) {
      await deleteResource.mutateAsync(id)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Biblioteca de Recursos
          </h1>
          <p className="mt-1 text-muted">
            Gestiona los materiales de apoyo para tus estudiantes.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Nuevo Recurso
            </>
          )}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="border-primary/30 border-2">
          <CardHeader>
            <CardTitle className="text-lg">Crear Nuevo Recurso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formError && (
              <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {formError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Titulo *</Label>
                <Input
                  placeholder="Nombre del recurso"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <div className="flex gap-2 flex-wrap">
                  {(['video', 'referencia', 'plantilla', 'glosario'] as Resource['type'][]).map(
                    (t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, type: t })}
                        className={cn(
                          'rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all',
                          form.type === t
                            ? 'bg-primary text-white'
                            : 'bg-secondary text-muted hover:text-foreground'
                        )}
                      >
                        {t}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contenido *</Label>
              <Textarea
                placeholder="Contenido del recurso..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <div className="flex flex-col gap-1">
                  {(['conceptual', 'procedimental', 'caso_resuelto'] as Resource['category'][]).map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm({ ...form, category: c })}
                        className={cn(
                          'rounded-lg px-3 py-2 text-xs font-medium capitalize text-left transition-all',
                          form.category === c
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted hover:bg-secondary hover:text-foreground'
                        )}
                      >
                        {c.replace('_', ' ')}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Palabras clave</Label>
                <Input
                  placeholder="separadas por comas"
                  value={form.keywords}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Nivel minimo</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={form.min_level}
                  onChange={(e) =>
                    setForm({ ...form, min_level: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setForm(emptyResource)
                  setFormError('')
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createResource.isPending}>
                {createResource.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar Recurso
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Buscar recurso..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Resources list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-muted/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            {search ? 'No se encontraron recursos' : 'Sin recursos aun'}
          </h3>
          <p className="mt-1 text-sm text-muted">
            {search
              ? 'Intenta con otro termino de busqueda.'
              : 'Crea tu primer recurso para tus estudiantes.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((resource) => {
            const Icon = getTypeIcon(resource.type)
            const colorClasses = getTypeColor(resource.type)
            return (
              <Card key={resource.id} className="border-border/50 hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', colorClasses)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {resource.title}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs capitalize">
                            {resource.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {resource.category.replace('_', ' ')}
                          </Badge>
                          {resource.min_level > 1 && (
                            <span className="text-xs text-muted">
                              Niv. {resource.min_level}+
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-4 shrink-0">
                      <button
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-secondary hover:text-foreground transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <p className="text-sm text-muted">
          {filtered.length} recurso{filtered.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
