import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { HelpCircle, BookOpen, AlertTriangle, CheckCircle } from 'lucide-react'
import type { Protocol } from '@/types'

interface StepQuestionProps {
  protocol: Protocol
  onUpdate: (data: Partial<Protocol>) => void
}

export default function StepQuestion({ protocol, onUpdate }: StepQuestionProps) {
  const [question, setQuestion] = useState(protocol.research_question || '')

  const hasQuestionMarks = question.includes('?') && question.includes('?')
  const wordCount = question.trim().split(/\s+/).filter(Boolean).length
  const hasMinLength = wordCount >= 10

  const validations = [
    {
      label: 'Contiene signos de interrogacion (?...?)',
      valid: hasQuestionMarks,
    },
    {
      label: 'Longitud adecuada (minimo 10 palabras)',
      valid: hasMinLength,
    },
  ]

  function handleChange(value: string) {
    setQuestion(value)
    onUpdate({ research_question: value })
  }

  return (
    <div className="space-y-6">
      {/* Campo de pregunta */}
      <div className="space-y-3">
        <Label htmlFor="research-question" className="text-base font-semibold">
          Pregunta de investigacion
        </Label>
        <p className="text-sm text-muted">
          Formula una pregunta clara y especifica que guiara toda tu investigacion.
          Debe ser medible, relevante y factible.
        </p>
        <Textarea
          id="research-question"
          value={question}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="?Cual es la relacion entre...?"
          rows={4}
          className="resize-none text-lg"
        />
        <p className="text-xs text-muted text-right">{wordCount} palabras</p>
      </div>

      {/* Validaciones en tiempo real */}
      {question.length > 0 && (
        <div className="space-y-2">
          {validations.map((v, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {v.valid ? (
                <CheckCircle className="size-4 text-success shrink-0" />
              ) : (
                <AlertTriangle className="size-4 text-warning shrink-0" />
              )}
              <span className={v.valid ? 'text-success' : 'text-muted'}>{v.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Micro-leccion */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-5 text-primary" />
            Caracteristicas de una buena pregunta de investigacion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span><strong>Clara:</strong> Se entiende sin ambiguedades.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span><strong>Especifica:</strong> Define exactamente que se va a investigar.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span><strong>Medible:</strong> Las variables pueden ser observadas o cuantificadas.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span><strong>Factible:</strong> Es posible responderla con los recursos disponibles.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span><strong>Relevante:</strong> Aporta valor al campo de estudio.</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Ejemplos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-muted">
            <HelpCircle className="size-5" />
            Ejemplos de preguntas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-sm text-foreground italic">
                "?Cual es el efecto del uso de dispositivos moviles en el rendimiento academico
                de estudiantes universitarios de primer ano?"
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-sm text-foreground italic">
                "?Existe relacion entre los estilos de liderazgo docente y la motivacion
                intrinseca de los estudiantes de secundaria?"
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-sm text-foreground italic">
                "?Como perciben los docentes de educacion basica la implementacion de metodologias
                activas en el aula?"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
