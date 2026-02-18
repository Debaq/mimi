import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { MicroDefense as MicroDefenseType, ApiResponse } from '@/types'

interface MicroDefenseProps {
  protocolId: number
  step: number
  onComplete: (defense: MicroDefenseType) => void
}

export default function MicroDefense({ protocolId, step, onComplete }: MicroDefenseProps) {
  const [open, setOpen] = useState(false)
  const [defense, setDefense] = useState<MicroDefenseType | null>(null)
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function fetchDefense() {
    setLoading(true)
    try {
      const result = await api.post<ApiResponse<{ defense_id: number; step: number; objection: string }>>(
        `/protocols/${protocolId}/defense`,
        { step }
      )
      const d = result.data
      setDefense({ id: d.defense_id, protocol_id: protocolId, step: d.step, objection: d.objection, student_response: null, score: null, status: 'pendiente' })
      setResponse('')
      setFetchError(null)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'No se pudo generar la micro-defensa')
    } finally {
      setLoading(false)
    }
  }

  function handleOpen() {
    setOpen(true)
    setShowResult(false)
    fetchDefense()
  }

  async function handleSubmit() {
    if (!defense || !response.trim()) return
    setSubmitting(true)
    try {
      const result = await api.put<ApiResponse<{ score: number; status: string; xp_earned: number }>>(
        `/defenses/${defense.id}`,
        { response }
      )
      const updated = { ...defense, score: result.data.score, status: result.data.status as MicroDefenseType['status'], student_response: response }
      setDefense(updated)
      setShowResult(true)
      onComplete(updated)
      setSubmitError(null)
      if (result.data.score >= 60) {
        toast('success', `Micro-defensa aprobada con ${result.data.score}/100`)
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al enviar la defensa')
    } finally {
      setSubmitting(false)
    }
  }

  const isPassed = defense?.score !== null && defense?.score !== undefined && defense.score >= 60

  return (
    <>
      <Button variant="outline" onClick={handleOpen} className="gap-2">
        <Shield className="size-4" />
        Micro-Defensa
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              Micro-Defensa - Paso {step}
            </DialogTitle>
            <DialogDescription>
              Responde a la siguiente objecion para demostrar tu comprension.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : showResult && defense ? (
            <div className="space-y-6 py-4">
              {/* Resultado animado */}
              <div className="flex flex-col items-center gap-4 text-center">
                <div
                  className={`flex size-20 items-center justify-center rounded-full ${
                    isPassed ? 'bg-success/10' : 'bg-destructive/10'
                  } transition-all duration-500`}
                >
                  {isPassed ? (
                    <CheckCircle className="size-10 text-success animate-[scale-in_300ms_ease-out]" />
                  ) : (
                    <XCircle className="size-10 text-destructive animate-[scale-in_300ms_ease-out]" />
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {defense.score} / 100
                  </p>
                  <Badge variant={isPassed ? 'success' : 'destructive'} className="mt-2">
                    {isPassed ? 'Aprobada' : 'Necesita mejorar'}
                  </Badge>
                </div>
                <p className="text-sm text-muted max-w-sm">
                  {isPassed
                    ? 'Excelente defensa. Has demostrado buena comprension de este paso.'
                    : 'Tu respuesta necesita mas desarrollo. Revisa los conceptos y vuelve a intentarlo.'}
                </p>
              </div>
            </div>
          ) : defense ? (
            <div className="space-y-4 py-2">
              {/* Objecion */}
              <div className="rounded-xl bg-secondary p-4">
                <p className="text-sm font-medium text-muted mb-1">Objecion:</p>
                <p className="text-foreground">{defense.objection}</p>
              </div>

              {/* Respuesta */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tu respuesta:
                </label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Escribe tu defensa aqui..."
                  rows={5}
                  className="resize-none"
                />
                <p className="text-xs text-muted text-right">
                  {response.trim().split(/\s+/).filter(Boolean).length} palabras
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-destructive text-sm">{fetchError || 'No se pudo cargar la micro-defensa.'}</p>
            </div>
          )}

          {submitError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          <DialogFooter>
            {showResult ? (
              <Button onClick={() => setOpen(false)}>Cerrar</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !response.trim() || loading}
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Enviar Defensa
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
