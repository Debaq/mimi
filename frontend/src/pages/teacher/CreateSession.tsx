import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Send,
  Loader2,
  Wrench,
  Search,
  FlaskConical,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { useCreateSession } from '@/hooks/useSessions'
import { cn } from '@/lib/utils'
import type { Session } from '@/types'

const modes: { value: Session['mode']; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    value: 'constructor',
    label: 'Constructor',
    description: 'Construccion guiada paso a paso del protocolo.',
    icon: Wrench,
  },
  {
    value: 'detective',
    label: 'Detective',
    description: 'Analisis y correccion de protocolos con errores.',
    icon: Search,
  },
  {
    value: 'laboratorio',
    label: 'Laboratorio',
    description: 'Experimentacion libre con componentes de investigacion.',
    icon: FlaskConical,
  },
]

const difficulties: { value: Session['difficulty']; label: string }[] = [
  { value: 'basico', label: 'Basico' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
]

export default function CreateSession() {
  const navigate = useNavigate()
  const createSession = useCreateSession()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState<Session['mode']>('constructor')
  const [difficulty, setDifficulty] = useState<Session['difficulty']>('basico')
  const [problemStatement, setProblemStatement] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [allowRetries, setAllowRetries] = useState(true)
  const [showHints, setShowHints] = useState(true)
  const [error, setError] = useState('')

  async function handleSubmit(status: 'borrador' | 'activa') {
    setError('')

    if (!title.trim()) {
      setError('El titulo es obligatorio.')
      return
    }

    if (!problemStatement.trim()) {
      setError('El planteamiento del problema es obligatorio.')
      return
    }

    try {
      await createSession.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        mode,
        difficulty,
        problem_statement: problemStatement.trim(),
        start_date: startDate || new Date().toISOString().split('T')[0],
        end_date: endDate || '',
        allow_retries: allowRetries,
        show_hints: showHints,
        status,
      })
      navigate('/teacher/sessions')
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error al crear la sesion.')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/teacher/sessions"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a sesiones
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Crear Nueva Sesion
        </h1>
        <p className="mt-1 text-muted">
          Configura los parametros de tu sesion de investigacion.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Informacion General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titulo de la sesion *</Label>
                <Input
                  id="title"
                  placeholder="Ej: Introduccion a Protocolos de Investigacion"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripcion</Label>
                <Textarea
                  id="description"
                  placeholder="Describe brevemente el objetivo de esta sesion..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem">Planteamiento del problema *</Label>
                <Textarea
                  id="problem"
                  placeholder="Escribe el planteamiento del problema que los estudiantes deberan abordar..."
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Mode selector */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Modo de Sesion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {modes.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMode(m.value)}
                    className={cn(
                      'flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all duration-200',
                      mode === m.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      mode === m.value ? 'bg-primary/10' : 'bg-secondary'
                    )}>
                      <m.icon className={cn('h-5 w-5', mode === m.value ? 'text-primary' : 'text-muted')} />
                    </div>
                    <div>
                      <p className={cn('text-sm font-semibold', mode === m.value ? 'text-primary' : 'text-foreground')}>
                        {m.label}
                      </p>
                      <p className="text-xs text-muted mt-0.5">{m.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Problem statement and dates */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Fechas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar config */}
        <div className="space-y-6">
          {/* Difficulty */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Dificultad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {difficulties.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDifficulty(d.value)}
                    className={cn(
                      'rounded-xl border-2 px-4 py-3 text-sm font-medium text-left transition-all',
                      difficulty === d.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted hover:border-primary/30 hover:text-foreground'
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Opciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-foreground">Permitir reintentos</span>
                <button
                  type="button"
                  onClick={() => setAllowRetries(!allowRetries)}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors duration-200',
                    allowRetries ? 'bg-primary' : 'bg-border'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                      allowRetries && 'translate-x-5'
                    )}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-foreground">Mostrar pistas</span>
                <button
                  type="button"
                  onClick={() => setShowHints(!showHints)}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors duration-200',
                    showHints ? 'bg-primary' : 'bg-border'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                      showHints && 'translate-x-5'
                    )}
                  />
                </button>
              </label>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-3">
              <Button
                className="w-full"
                onClick={() => handleSubmit('activa')}
                disabled={createSession.isPending}
              >
                {createSession.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Publicar Sesion
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSubmit('borrador')}
                disabled={createSession.isPending}
              >
                <Save className="h-4 w-4" />
                Guardar como Borrador
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
