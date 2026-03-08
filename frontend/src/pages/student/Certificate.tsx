import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Award,
  Download,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { generateCertificatePDF } from '@/lib/generateCertificate'
import { toast } from '@/components/ui/Toast'
import type { Certificate as CertificateType, ApiResponse } from '@/types'

export default function Certificate() {
  const { protocolId } = useParams<{ protocolId: string }>()
  const [certificate, setCertificate] = useState<CertificateType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchCertificate() {
      try {
        setLoading(true)
        setError(null)
        const res = await api.get<ApiResponse<CertificateType>>(
          `/certificates/${protocolId}`
        )
        setCertificate(res.data)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Error al obtener el certificado'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    if (protocolId) {
      fetchCertificate()
    }
  }, [protocolId])

  function handleDownload() {
    if (certificate) {
      generateCertificatePDF(certificate)
    }
  }

  async function handleCopyCode() {
    if (!certificate) return
    try {
      await navigator.clipboard.writeText(certificate.certificate_code)
      setCopied(true)
      toast('success', 'Codigo copiado al portapapeles')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast('error', 'No se pudo copiar el codigo')
    }
  }

  async function handleCopyLink() {
    if (!certificate) return
    const base = import.meta.env.BASE_URL.replace(/\/+$/, '')
    const url = `${window.location.origin}${base}/verify/${certificate.certificate_code}`
    try {
      await navigator.clipboard.writeText(url)
      toast('success', 'Enlace de verificacion copiado')
    } catch {
      toast('error', 'No se pudo copiar el enlace')
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Certificado</h1>
          <p className="mt-1 text-muted">Cargando tu certificado digital...</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Certificado</h1>
          <p className="mt-1 text-muted">No se pudo cargar el certificado.</p>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Error</p>
                <p className="mt-1 text-sm text-muted">{error}</p>
              </div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!certificate) return null

  const approvedDate = new Date(certificate.approved_at).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const issuedDate = new Date(certificate.issued_at).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Certificado Digital
          </h1>
          <p className="mt-1 text-muted">
            Tu certificado de aprobacion de protocolo de investigacion.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Preview del certificado */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 overflow-hidden">
            <div className="relative bg-gradient-to-br from-[#0f2748] via-[#1a3a6b] to-[#2563a8] p-8 sm:p-12">
              {/* Bordes decorativos */}
              <div className="absolute inset-3 border border-yellow-600/30 rounded pointer-events-none" />
              <div className="absolute inset-5 border border-yellow-600/15 rounded pointer-events-none" />

              <div className="relative text-center space-y-6">
                {/* Logo */}
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-yellow-500 tracking-[0.3em]">
                    MIMI
                  </div>
                  <div className="text-[10px] text-yellow-600/60 tracking-[0.2em] uppercase">
                    Mi Mentor de Investigacion
                  </div>
                </div>

                {/* Linea dorada */}
                <div className="mx-auto w-32 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent" />

                {/* Titulo */}
                <div>
                  <div className="text-[10px] text-white/50 tracking-[0.3em] uppercase">
                    Certificado de
                  </div>
                  <div className="text-lg sm:text-2xl text-white font-light tracking-wide">
                    Aprobacion de Protocolo
                  </div>
                </div>

                {/* Nombre */}
                <div>
                  <div className="text-[10px] text-white/40 tracking-[0.2em] uppercase mb-1">
                    Se otorga a
                  </div>
                  <div className="text-xl sm:text-3xl text-yellow-500 font-serif italic">
                    {certificate.student_name}
                  </div>
                </div>

                {/* Descripcion */}
                <p className="text-xs sm:text-sm text-white/60 max-w-md mx-auto leading-relaxed">
                  Por haber completado y aprobado el protocolo de investigacion en la sesion{' '}
                  <span className="text-white font-medium italic">
                    &ldquo;{certificate.session_title}&rdquo;
                  </span>
                </p>

                {/* Linea dorada pequena */}
                <div className="mx-auto w-20 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent" />

                {/* Fecha y codigo */}
                <div className="flex justify-between items-end text-left">
                  <div>
                    <div className="text-[9px] text-white/30 uppercase tracking-wider">
                      Fecha de aprobacion
                    </div>
                    <div className="text-xs text-white/70">{approvedDate}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-white/30 uppercase tracking-wider">
                      Codigo de verificacion
                    </div>
                    <div className="text-sm text-yellow-500 font-mono font-bold tracking-wider">
                      {certificate.certificate_code}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Boton de descarga */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-primary" />
                Descargar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <button
                onClick={handleDownload}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                Descargar como PDF
              </button>
              <p className="mt-3 text-xs text-muted text-center">
                Se abrira una ventana de impresion. Selecciona &ldquo;Guardar como PDF&rdquo; para
                descargar.
              </p>
            </CardContent>
          </Card>

          {/* Informacion del certificado */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wider">
                  Estudiante
                </p>
                <p className="text-sm text-foreground mt-0.5">{certificate.student_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wider">Sesion</p>
                <p className="text-sm text-foreground mt-0.5">{certificate.session_title}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wider">
                  Fecha de aprobacion
                </p>
                <p className="text-sm text-foreground mt-0.5">{approvedDate}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wider">
                  Fecha de emision
                </p>
                <p className="text-sm text-foreground mt-0.5">{issuedDate}</p>
              </div>
            </CardContent>
          </Card>

          {/* Codigo y verificacion */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Verificacion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Codigo */}
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  Codigo del certificado
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-secondary px-3 py-2 text-sm font-mono font-semibold text-foreground">
                    {certificate.certificate_code}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className="shrink-0 rounded-lg border border-border p-2 text-muted hover:text-foreground hover:bg-secondary transition-colors"
                    title="Copiar codigo"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Link de verificacion */}
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  Compartir verificacion
                </p>
                <div className="space-y-2">
                  <button
                    onClick={handleCopyLink}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar enlace
                  </button>
                  <Link
                    to={`/verify/${certificate.certificate_code}`}
                    target="_blank"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir pagina de verificacion
                  </Link>
                </div>
              </div>

              <p className="text-xs text-muted">
                Cualquier persona con este enlace o codigo puede verificar la autenticidad de tu
                certificado.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
