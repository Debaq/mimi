/**
 * Pagina de configuracion de integracion LMS
 *
 * Ruta sugerida: /teacher/lms
 * Para integrar en App.tsx, agregar:
 *   import LMSConfig from '@/pages/teacher/LMSConfig'
 *   <Route path="/teacher/lms" element={<LMSConfig />} />
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Settings,
  Link2,
  Copy,
  Check,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectOption } from '@/components/ui/Select'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'

interface LMSConfigData {
  id: number
  teacher_id: number
  platform: string
  lms_url: string
  consumer_key: string
  shared_secret: string
  config: Record<string, unknown>
  created_at: string
}

interface LMSConfigResponse {
  success: boolean
  message: string
  data: {
    config: LMSConfigData | null
    launch_url: string | null
    consumer_key?: string
    shared_secret?: string
  }
}

interface GradeEntry {
  student_name: string
  student_email: string
  protocol_status: string | null
  score: number
  xp_earned: number
  completed_at: string | null
  current_step: string | null
}

interface GradesResponse {
  success: boolean
  message: string
  data: {
    session: { id: number; title: string }
    grades: GradeEntry[]
    total_students: number
  }
}

interface SyncResult {
  synced: number
  skipped: number
  failed: number
  details: Array<{
    student: string
    status: string
    reason?: string
    score?: number
  }>
}

interface SyncResponse {
  success: boolean
  message: string
  data: SyncResult
}

interface SessionItem {
  id: number
  title: string
  status: string
  student_count?: number
}

interface SessionsResponse {
  success: boolean
  data: SessionItem[]
}

type Platform = 'moodle' | 'canvas' | 'generic'

const platformLabels: Record<Platform, string> = {
  moodle: 'Moodle',
  canvas: 'Canvas LMS',
  generic: 'Generico (LTI 1.0)',
}

const platformInstructions: Record<Platform, string[]> = {
  moodle: [
    'Ve a Administracion del sitio > Plugins > Modulos de actividad > Herramienta externa > Gestionar herramientas',
    'Haz clic en "Configurar una herramienta manualmente"',
    'Introduce el nombre "MIMI" y pega la Launch URL',
    'Introduce el Consumer Key y Shared Secret',
    'En "Uso de contenedor de lanzamiento" selecciona "Nueva ventana"',
    'Guarda los cambios y ya podras agregar MIMI como actividad en tus cursos',
  ],
  canvas: [
    'Ve a Configuracion del curso > Aplicaciones > Ver configuraciones de aplicaciones',
    'Haz clic en "+App" y selecciona "Configuracion manual"',
    'Introduce el nombre "MIMI" y pega la Launch URL en "URL de lanzamiento"',
    'Introduce el Consumer Key y Shared Secret',
    'En "Dominio", ingresa el dominio de tu servidor MIMI',
    'Selecciona "Privacidad: Publica" para enviar datos del usuario',
    'Guarda y la aplicacion aparecera como herramienta externa en tus modulos',
  ],
  generic: [
    'Accede al panel de administracion de tu LMS',
    'Busca la seccion de herramientas externas o LTI',
    'Crea una nueva herramienta externa con tipo LTI 1.0',
    'Introduce el nombre "MIMI" y pega la Launch URL',
    'Configura el Consumer Key y Shared Secret proporcionados',
    'Asegurate de que el LMS envie los datos del usuario (nombre, email, rol)',
    'Guarda la configuracion y prueba el lanzamiento',
  ],
}

export default function LMSConfig() {
  useAuth() // verificar autenticacion

  // Estado del formulario
  const [platform, setPlatform] = useState<Platform>('moodle')
  const [lmsUrl, setLmsUrl] = useState('')
  const [consumerKey, setConsumerKey] = useState('')
  const [sharedSecret, setSharedSecret] = useState('')

  // Estado de la configuracion guardada
  const [savedConfig, setSavedConfig] = useState<LMSConfigData | null>(null)
  const [launchUrl, setLaunchUrl] = useState<string | null>(null)
  const [savedConsumerKey, setSavedConsumerKey] = useState('')
  const [savedSharedSecret, setSavedSharedSecret] = useState('')

  // Estado de la UI
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Estado de calificaciones
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [grades, setGrades] = useState<GradeEntry[]>([])
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  // Cargar configuracion existente
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get<LMSConfigResponse>('/lms/config')
      if (res.data?.config) {
        const cfg = res.data.config
        setSavedConfig(cfg)
        setPlatform(cfg.platform as Platform)
        setLmsUrl(cfg.lms_url)
        setConsumerKey(cfg.consumer_key)
        setSharedSecret(cfg.shared_secret)
        setSavedConsumerKey(cfg.consumer_key)
        setSavedSharedSecret(cfg.shared_secret)
        setLaunchUrl(res.data.launch_url)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error cargando configuracion'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar sesiones del docente
  const loadSessions = useCallback(async () => {
    try {
      const res = await api.get<SessionsResponse>('/sessions')
      if (res.data) {
        setSessions(res.data)
      }
    } catch {
      // No mostrar error por las sesiones
    }
  }, [])

  useEffect(() => {
    loadConfig()
    loadSessions()
  }, [loadConfig, loadSessions])

  // Guardar configuracion
  const handleSave = async () => {
    setError(null)
    setSuccessMsg(null)

    if (!lmsUrl.trim()) {
      setError('La URL del LMS es requerida')
      return
    }

    try {
      setSaving(true)
      const res = await api.post<LMSConfigResponse>('/lms/configure', {
        platform,
        lms_url: lmsUrl.trim(),
        consumer_key: consumerKey.trim() || undefined,
        shared_secret: sharedSecret.trim() || undefined,
      })

      if (res.data) {
        setSavedConfig(res.data.config)
        setLaunchUrl(res.data.launch_url)
        if (res.data.consumer_key) {
          setConsumerKey(res.data.consumer_key)
          setSavedConsumerKey(res.data.consumer_key)
        }
        if (res.data.shared_secret) {
          setSharedSecret(res.data.shared_secret)
          setSavedSharedSecret(res.data.shared_secret)
        }
        setSuccessMsg(res.message || 'Configuracion guardada exitosamente')
        setTimeout(() => setSuccessMsg(null), 5000)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error guardando configuracion'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  // Copiar al portapapeles
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      // Fallback para navegadores sin soporte
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  // Cargar calificaciones de una sesion
  const loadGrades = async (sessionId: string) => {
    if (!sessionId) {
      setGrades([])
      return
    }

    try {
      setLoadingGrades(true)
      const res = await api.get<GradesResponse>(`/lms/grades/${sessionId}`)
      if (res.data?.grades) {
        setGrades(res.data.grades)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error cargando calificaciones'
      setError(msg)
    } finally {
      setLoadingGrades(false)
    }
  }

  // Exportar CSV
  const exportCSV = () => {
    if (!selectedSessionId) return
    const baseUrl = import.meta.env.VITE_API_URL || '/api'
    window.open(`${baseUrl}/lms/grades/${selectedSessionId}?format=csv`, '_blank')
  }

  // Sincronizar calificaciones al LMS
  const syncGrades = async () => {
    if (!selectedSessionId) return

    try {
      setSyncing(true)
      setSyncResult(null)
      const res = await api.post<SyncResponse>('/lms/grades/sync', {
        session_id: parseInt(selectedSessionId, 10),
      })
      if (res.data) {
        setSyncResult(res.data)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sincronizando calificaciones'
      setError(msg)
    } finally {
      setSyncing(false)
    }
  }

  const statusLabel = (status: string | null): string => {
    const labels: Record<string, string> = {
      aprobado: 'Aprobado',
      en_revision: 'En revision',
      borrador: 'Borrador',
      en_progreso: 'En progreso',
      rechazado: 'Rechazado',
    }
    return status ? (labels[status] || status) : 'Sin iniciar'
  }

  const statusVariant = (status: string | null): 'success' | 'secondary' | 'outline' | 'destructive' => {
    if (status === 'aprobado') return 'success'
    if (status === 'en_revision') return 'outline'
    if (status === 'rechazado') return 'destructive'
    return 'secondary'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-secondary" />
        <div className="h-64 animate-pulse rounded-xl bg-secondary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Integracion LMS
        </h1>
        <p className="mt-1 text-muted">
          Conecta MIMI con tu plataforma de gestion del aprendizaje (Moodle, Canvas, etc.)
        </p>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <Alert variant="destructive" icon={<AlertCircle />}>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMsg && (
        <Alert variant="success" icon={<CheckCircle2 />}>
          <AlertTitle>Exito</AlertTitle>
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulario de configuracion */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-primary" />
              Configuracion LMS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Plataforma</Label>
              <Select
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
              >
                <SelectOption value="moodle">Moodle</SelectOption>
                <SelectOption value="canvas">Canvas LMS</SelectOption>
                <SelectOption value="generic">Generico (LTI 1.0)</SelectOption>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lms_url">URL del LMS</Label>
              <Input
                id="lms_url"
                type="url"
                placeholder="https://tu-moodle.example.com"
                value={lmsUrl}
                onChange={(e) => setLmsUrl(e.target.value)}
              />
              <p className="text-xs text-muted">
                URL base de tu plataforma LMS (sin barra al final)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumer_key">Consumer Key</Label>
              <Input
                id="consumer_key"
                type="text"
                placeholder="Se genera automaticamente si se deja vacio"
                value={consumerKey}
                onChange={(e) => setConsumerKey(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shared_secret">Shared Secret</Label>
              <Input
                id="shared_secret"
                type="text"
                placeholder="Se genera automaticamente si se deja vacio"
                value={sharedSecret}
                onChange={(e) => setSharedSecret(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {savedConfig ? 'Actualizar Configuracion' : 'Guardar Configuracion'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Datos de conexion */}
        <div className="space-y-6">
          {/* Credenciales generadas */}
          {savedConfig && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Link2 className="h-5 w-5 text-success" />
                  Datos de Conexion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Launch URL</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={launchUrl || ''}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(launchUrl || '', 'launch_url')}
                    >
                      {copiedField === 'launch_url' ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Consumer Key</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={savedConsumerKey}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(savedConsumerKey, 'consumer_key')}
                    >
                      {copiedField === 'consumer_key' ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Shared Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={savedSharedSecret}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(savedSharedSecret, 'shared_secret')}
                    >
                      {copiedField === 'shared_secret' ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3">
                  <Badge variant="success">
                    {platformLabels[savedConfig.platform as Platform] || savedConfig.platform}
                  </Badge>
                  <span className="text-xs text-muted">
                    Configurado el{' '}
                    {new Date(savedConfig.created_at).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instrucciones de configuracion */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ExternalLink className="h-5 w-5 text-accent" />
                Instrucciones para {platformLabels[platform]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {platformInstructions[platform].map((step, idx) => (
                  <li key={idx} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                    <span className="text-muted">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seccion de calificaciones */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="h-5 w-5 text-warning" />
            Calificaciones y Sincronizacion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="session_select">Sesion</Label>
              <Select
                id="session_select"
                value={selectedSessionId}
                onChange={(e) => {
                  setSelectedSessionId(e.target.value)
                  setSyncResult(null)
                  loadGrades(e.target.value)
                }}
              >
                <SelectOption value="">Seleccionar sesion...</SelectOption>
                {sessions.map((s) => (
                  <SelectOption key={s.id} value={String(s.id)}>
                    {s.title} ({s.status})
                  </SelectOption>
                ))}
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                disabled={!selectedSessionId}
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>

              {savedConfig && (
                <Button
                  size="sm"
                  onClick={syncGrades}
                  disabled={!selectedSessionId || syncing}
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Sincronizar al LMS
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Resultado de sincronizacion */}
          {syncResult && (
            <Alert
              variant={syncResult.failed > 0 ? 'warning' : 'success'}
              icon={syncResult.failed > 0 ? <AlertCircle /> : <CheckCircle2 />}
            >
              <AlertTitle>Resultado de sincronizacion</AlertTitle>
              <AlertDescription>
                {syncResult.synced} enviadas, {syncResult.skipped} omitidas, {syncResult.failed} fallidas
              </AlertDescription>
            </Alert>
          )}

          {/* Tabla de calificaciones */}
          {loadingGrades ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-secondary" />
              ))}
            </div>
          ) : grades.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/30">
                    <th className="px-4 py-3 text-left font-medium text-muted">Estudiante</th>
                    <th className="px-4 py-3 text-left font-medium text-muted">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-muted">Estado</th>
                    <th className="px-4 py-3 text-right font-medium text-muted">Score</th>
                    <th className="px-4 py-3 text-right font-medium text-muted">XP</th>
                    <th className="px-4 py-3 text-left font-medium text-muted">Completado</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-border/30 transition-colors hover:bg-secondary/20"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted" />
                          {grade.student_name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{grade.student_email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(grade.protocol_status)}>
                          {statusLabel(grade.protocol_status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        {(grade.score * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        {grade.xp_earned}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {grade.completed_at
                          ? new Date(grade.completed_at).toLocaleDateString('es-MX')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : selectedSessionId ? (
            <div className="py-8 text-center">
              <GraduationCap className="mx-auto h-10 w-10 text-muted/50" />
              <p className="mt-3 text-sm text-muted">
                No hay estudiantes inscritos en esta sesion.
              </p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <GraduationCap className="mx-auto h-10 w-10 text-muted/50" />
              <p className="mt-3 text-sm text-muted">
                Selecciona una sesion para ver las calificaciones.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
