import { useState } from 'react'
import { toast } from '@/components/ui/Toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Select, SelectOption } from '@/components/ui/Select'
import { Separator } from '@/components/ui/Separator'
import { Badge } from '@/components/ui/Badge'
import { useCreateSession } from '@/hooks/useSessions'
import { Loader2, Plus, Eye, Settings } from 'lucide-react'
import type { Session } from '@/types'

interface CreateSessionFormProps {
  onSuccess?: (session: Session) => void
  onCancel?: () => void
}

interface FormData {
  title: string
  description: string
  mode: Session['mode']
  difficulty: Session['difficulty']
  problem_statement: string
  start_date: string
  end_date: string
  allow_retries: boolean
  show_hints: boolean
}

const INITIAL_FORM: FormData = {
  title: '',
  description: '',
  mode: 'constructor',
  difficulty: 'basico',
  problem_statement: '',
  start_date: '',
  end_date: '',
  allow_retries: true,
  show_hints: true,
}

export default function CreateSessionForm({ onSuccess, onCancel }: CreateSessionFormProps) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [showPreview, setShowPreview] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const createSession = useCreateSession()

  function handleChange<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function touch(field: string) {
    setTouched((p) => ({ ...p, [field]: true }))
  }

  function fieldError(field: string): string | null {
    if (!touched[field] && !submitted) return null
    switch (field) {
      case 'title':
        return !form.title.trim() ? 'El titulo es obligatorio' : null
      case 'description':
        return !form.description.trim() ? 'La descripcion es obligatoria' : null
      case 'problem_statement': {
        if (!form.problem_statement.trim()) return 'El planteamiento es obligatorio'
        const words = form.problem_statement.trim().split(/\s+/).filter(Boolean).length
        return words < 20 ? 'Minimo 20 palabras' : null
      }
      case 'start_date':
        return !form.start_date ? 'Fecha de inicio requerida' : null
      case 'end_date':
        if (!form.end_date) return 'Fecha de cierre requerida'
        if (form.start_date && form.end_date < form.start_date) return 'Debe ser posterior al inicio'
        return null
      default:
        return null
    }
  }

  const titleErr = fieldError('title')
  const descErr = fieldError('description')
  const problemErr = fieldError('problem_statement')
  const startErr = fieldError('start_date')
  const endErr = fieldError('end_date')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (titleErr || descErr || problemErr || startErr || endErr) return
    try {
      const result = await createSession.mutateAsync(form)
      onSuccess?.(result.data)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Error al crear la sesion')
    }
  }

  const isValid =
    form.title.trim() &&
    form.description.trim() &&
    form.problem_statement.trim() &&
    form.start_date &&
    form.end_date

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="size-5 text-primary" />
            Crear nueva sesion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informacion basica */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Informacion basica</h3>

            <div className="space-y-2">
              <Label htmlFor="title">Titulo de la sesion</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                onBlur={() => touch('title')}
                error={!!titleErr}
                placeholder="Ej: Metodologia de la investigacion - Grupo A"
              />
              {titleErr && <p className="text-xs text-destructive">{titleErr}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                onBlur={() => touch('description')}
                error={!!descErr}
                placeholder="Describe el objetivo de la sesion..."
                rows={3}
              />
              {descErr && <p className="text-xs text-destructive">{descErr}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Modo de juego</Label>
                <Select
                  value={form.mode}
                  onChange={(e) => handleChange('mode', e.target.value as Session['mode'])}
                >
                  <SelectOption value="constructor">Constructor</SelectOption>
                  <SelectOption value="detective">Detective</SelectOption>
                  <SelectOption value="laboratorio">Laboratorio</SelectOption>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dificultad</Label>
                <Select
                  value={form.difficulty}
                  onChange={(e) =>
                    handleChange('difficulty', e.target.value as Session['difficulty'])
                  }
                >
                  <SelectOption value="basico">Basico</SelectOption>
                  <SelectOption value="intermedio">Intermedio</SelectOption>
                  <SelectOption value="avanzado">Avanzado</SelectOption>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Planteamiento del problema */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Planteamiento del problema</h3>
            <div className="space-y-2">
              <Label htmlFor="problem">Escenario del problema</Label>
              <Textarea
                id="problem"
                value={form.problem_statement}
                onChange={(e) => handleChange('problem_statement', e.target.value)}
                onBlur={() => touch('problem_statement')}
                error={!!problemErr}
                placeholder="Describe el escenario problemico que los estudiantes deberan analizar..."
                rows={6}
              />
              <div className="flex justify-between">
                {problemErr ? (
                  <p className="text-xs text-destructive">{problemErr}</p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-muted">
                  {form.problem_statement.trim().split(/\s+/).filter(Boolean).length} palabras
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Fechas */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Fechas</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-date">Fecha de inicio</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  onBlur={() => touch('start_date')}
                  error={!!startErr}
                />
                {startErr && <p className="text-xs text-destructive">{startErr}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">Fecha de cierre</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  onBlur={() => touch('end_date')}
                  error={!!endErr}
                />
                {endErr && <p className="text-xs text-destructive">{endErr}</p>}
              </div>
            </div>
          </div>

          <Separator />

          {/* Configuracion */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Settings className="size-4" />
              Configuracion
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allow_retries}
                  onChange={(e) => handleChange('allow_retries', e.target.checked)}
                  className="size-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Permitir reintentos</p>
                  <p className="text-xs text-muted">
                    Los estudiantes podran reenviar su protocolo despues de correcciones.
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_hints}
                  onChange={(e) => handleChange('show_hints', e.target.checked)}
                  className="size-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Mostrar pistas</p>
                  <p className="text-xs text-muted">
                    Se mostraran sugerencias y tips en cada paso del protocolo.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vista previa */}
      {showPreview && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="size-4 text-primary" />
              Vista previa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted">Titulo</p>
              <p className="font-medium text-foreground">{form.title || '(sin titulo)'}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">{form.mode}</Badge>
              <Badge variant="outline">{form.difficulty}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted">Descripcion</p>
              <p className="text-sm text-foreground">{form.description || '(sin descripcion)'}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Problema</p>
              <p className="text-sm text-foreground line-clamp-3">
                {form.problem_statement || '(sin planteamiento)'}
              </p>
            </div>
            {form.start_date && form.end_date && (
              <div>
                <p className="text-xs text-muted">Periodo</p>
                <p className="text-sm text-foreground">
                  {new Date(form.start_date).toLocaleDateString('es-ES')} -{' '}
                  {new Date(form.end_date).toLocaleDateString('es-ES')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          <Eye className="size-4" />
          {showPreview ? 'Ocultar vista previa' : 'Vista previa'}
        </Button>
        <div className="flex gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={!isValid || createSession.isPending} className="gap-2">
            {createSession.isPending && <Loader2 className="size-4 animate-spin" />}
            Crear sesion
          </Button>
        </div>
      </div>
    </form>
  )
}
