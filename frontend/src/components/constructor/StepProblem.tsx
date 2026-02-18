import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { FileText, ChevronDown, ChevronUp, Lightbulb, AlertTriangle } from 'lucide-react'
import type { Protocol } from '@/types'

interface StepProblemProps {
  protocol: Protocol
  onUpdate: (data: Partial<Protocol>) => void
  problemScenario?: string
}

export default function StepProblem({ protocol, onUpdate, problemScenario }: StepProblemProps) {
  const [text, setText] = useState(protocol.problem_statement || '')
  const [showTips, setShowTips] = useState(false)

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const isValid = wordCount >= 50

  function handleChange(value: string) {
    setText(value)
    onUpdate({ problem_statement: value })
  }

  return (
    <div className="space-y-6">
      {/* Escenario del problema (solo lectura) */}
      {problemScenario && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-5 text-primary" />
              Escenario del Problema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">{problemScenario}</p>
          </CardContent>
        </Card>
      )}

      {/* Interpretacion del estudiante */}
      <div className="space-y-3">
        <Label htmlFor="problem-statement" className="text-base font-semibold">
          Tu interpretacion del problema
        </Label>
        <p className="text-sm text-muted">
          Describe el problema de investigacion con tus propias palabras. Identifica las variables
          clave y el contexto del estudio.
        </p>
        <Textarea
          id="problem-statement"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Escribe tu planteamiento del problema aqui..."
          rows={8}
          error={text.length > 0 && !isValid}
          className="resize-y"
        />

        {/* Contador de palabras */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {text.length > 0 && !isValid && (
              <Alert variant="warning" className="py-2 px-3" icon={<AlertTriangle className="size-4" />}>
                <AlertDescription className="text-xs">
                  Minimo 50 palabras requeridas
                </AlertDescription>
              </Alert>
            )}
          </div>
          <span
            className={`text-sm font-medium ${
              isValid ? 'text-success' : text.length > 0 ? 'text-warning' : 'text-muted'
            }`}
          >
            {wordCount} / 50 palabras
          </span>
        </div>
      </div>

      {/* Tips colapsables */}
      <Card>
        <button
          type="button"
          onClick={() => setShowTips(!showTips)}
          className="flex w-full items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors rounded-xl"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Lightbulb className="size-4 text-warning" />
            Consejos para un buen planteamiento
          </span>
          {showTips ? (
            <ChevronUp className="size-4 text-muted" />
          ) : (
            <ChevronDown className="size-4 text-muted" />
          )}
        </button>
        {showTips && (
          <CardContent className="pt-0 pb-4">
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                Describe la situacion actual y por que es un problema.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                Identifica las variables principales del estudio.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                Menciona el contexto geografico y temporal.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                Explica la relevancia del problema para la comunidad cientifica o sociedad.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                Usa un lenguaje claro, preciso y sin ambiguedades.
              </li>
            </ul>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
