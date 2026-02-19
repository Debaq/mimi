import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Search,
  ShieldCheck,
  ShieldX,
  Loader2,
  ArrowLeft,
  Award,
  Calendar,
  BookOpen,
  User,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { api } from '@/lib/api'
import type { ApiResponse } from '@/types'

interface VerifyResult {
  certificate_code: string
  student_name: string
  session_title: string
  approved_at: string
  issued_at: string
}

export default function VerifyCertificate() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [inputCode, setInputCode] = useState(code || '')
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (code) {
      setInputCode(code)
      verifyCode(code)
    }
  }, [code])

  async function verifyCode(codeToVerify: string) {
    const trimmed = codeToVerify.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    setResult(null)
    setSearched(true)

    try {
      const res = await api.get<ApiResponse<VerifyResult>>(
        `/certificates/verify/${encodeURIComponent(trimmed)}`
      )
      setResult(res.data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo verificar el certificado'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputCode.trim()
    if (!trimmed) return

    // Actualizar la URL si no coincide
    if (trimmed !== code) {
      navigate(`/verify/${trimmed}`, { replace: true })
    } else {
      verifyCode(trimmed)
    }
  }

  const approvedDate = result
    ? new Date(result.approved_at).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  const issuedDate = result
    ? new Date(result.issued_at).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white text-xs font-bold">
              M
            </div>
            <span className="text-lg font-semibold">MIMI</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Inicio
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Verificar Certificado
          </h1>
          <p className="mt-2 text-muted">
            Ingresa el codigo del certificado para verificar su autenticidad.
          </p>
        </div>

        {/* Formulario de busqueda */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="Ej: MIMI-2026-ABC12345"
                className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputCode.trim()}
              className="shrink-0 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Verificar'
              )}
            </button>
          </div>
        </form>

        {/* Resultado: cargando */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Resultado: certificado valido */}
        {!loading && result && (
          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                  <ShieldCheck className="h-8 w-8 text-success" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-success">Certificado Valido</h2>
                  <p className="mt-1 text-sm text-muted">
                    Este certificado es autentico y fue emitido por MIMI.
                  </p>
                </div>

                <div className="w-full space-y-4 text-left">
                  <div className="flex items-start gap-3 rounded-xl bg-card border border-border/50 p-4">
                    <User className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-muted uppercase tracking-wider">
                        Estudiante
                      </p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {result.student_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl bg-card border border-border/50 p-4">
                    <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-muted uppercase tracking-wider">
                        Sesion
                      </p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {result.session_title}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 rounded-xl bg-card border border-border/50 p-4">
                      <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-muted uppercase tracking-wider">
                          Aprobacion
                        </p>
                        <p className="text-sm text-foreground mt-0.5">{approvedDate}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl bg-card border border-border/50 p-4">
                      <Award className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-muted uppercase tracking-wider">
                          Emision
                        </p>
                        <p className="text-sm text-foreground mt-0.5">{issuedDate}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-card border border-border/50 p-4 text-center">
                    <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                      Codigo de verificacion
                    </p>
                    <code className="text-base font-mono font-bold text-primary tracking-wider">
                      {result.certificate_code}
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultado: no encontrado */}
        {!loading && searched && error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <ShieldX className="h-8 w-8 text-destructive" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-destructive">
                    Certificado No Encontrado
                  </h2>
                  <p className="mt-2 text-sm text-muted max-w-sm">
                    {error}
                  </p>
                </div>

                <p className="text-xs text-muted">
                  Verifica que el codigo sea correcto e intenta nuevamente. El formato esperado es{' '}
                  <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-foreground">
                    MIMI-AAAA-XXXXXXXX
                  </code>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado inicial */}
        {!loading && !searched && (
          <div className="text-center py-8 text-muted">
            <Award className="mx-auto h-12 w-12 text-muted/30 mb-4" />
            <p className="text-sm">
              Ingresa un codigo de certificado para comenzar la verificacion.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-auto">
        <div className="mx-auto max-w-2xl px-4 py-6 text-center text-xs text-muted">
          MIMI &mdash; Mi Mentor de Investigacion
        </div>
      </footer>
    </div>
  )
}
