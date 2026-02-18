import { useState } from 'react'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectOption } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Compass, BookOpen } from 'lucide-react'
import MicroDefense from './MicroDefense'
import type { Protocol, ResearchDesign } from '@/types'

interface StepDesignProps {
  protocol: Protocol
  onUpdate: (data: Partial<Protocol>) => void
}

const APPROACHES = [
  { value: 'cuantitativo', label: 'Cuantitativo' },
  { value: 'cualitativo', label: 'Cualitativo' },
  { value: 'mixto', label: 'Mixto' },
]

const DESIGN_TYPES = [
  { value: 'experimental', label: 'Experimental' },
  { value: 'cuasiexperimental', label: 'Cuasiexperimental' },
  { value: 'no experimental', label: 'No experimental' },
  { value: 'correlacional', label: 'Correlacional' },
  { value: 'descriptivo', label: 'Descriptivo' },
  { value: 'etnografico', label: 'Etnografico' },
  { value: 'fenomenologico', label: 'Fenomenologico' },
  { value: 'teoria fundamentada', label: 'Teoria fundamentada' },
]

const SCOPES = [
  { value: 'exploratorio', label: 'Exploratorio' },
  { value: 'descriptivo', label: 'Descriptivo' },
  { value: 'correlacional', label: 'Correlacional' },
  { value: 'explicativo', label: 'Explicativo' },
]

export default function StepDesign({ protocol, onUpdate }: StepDesignProps) {
  const [design, setDesign] = useState<ResearchDesign>(
    protocol.research_design || { approach: 'cuantitativo', type: '', scope: 'descriptivo' }
  )
  const [justification, setJustification] = useState(protocol.justification || '')

  function handleDesignChange(field: keyof ResearchDesign, value: string) {
    const updated = { ...design, [field]: value }
    setDesign(updated)
    onUpdate({ research_design: updated })
  }

  function handleJustificationChange(value: string) {
    setJustification(value)
    onUpdate({ justification: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold">Diseno de investigacion</Label>
        <p className="text-sm text-muted mt-1">
          Selecciona el enfoque, tipo y alcance de tu investigacion. Justifica por que es el
          diseno mas adecuado.
        </p>
      </div>

      {/* Selecciones de diseno */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-1.5">
            <Compass className="size-3.5 text-primary" />
            Enfoque
          </Label>
          <Select
            value={design.approach}
            onChange={(e) => handleDesignChange('approach', e.target.value)}
          >
            <SelectOption value="" disabled>
              Seleccionar enfoque
            </SelectOption>
            {APPROACHES.map((a) => (
              <SelectOption key={a.value} value={a.value}>
                {a.label}
              </SelectOption>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Tipo de diseno</Label>
          <Select
            value={design.type}
            onChange={(e) => handleDesignChange('type', e.target.value)}
          >
            <SelectOption value="" disabled>
              Seleccionar tipo
            </SelectOption>
            {DESIGN_TYPES.map((d) => (
              <SelectOption key={d.value} value={d.value}>
                {d.label}
              </SelectOption>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Alcance</Label>
          <Select
            value={design.scope}
            onChange={(e) => handleDesignChange('scope', e.target.value)}
          >
            <SelectOption value="" disabled>
              Seleccionar alcance
            </SelectOption>
            {SCOPES.map((s) => (
              <SelectOption key={s.value} value={s.value}>
                {s.label}
              </SelectOption>
            ))}
          </Select>
        </div>
      </div>

      {/* Informacion del enfoque */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BookOpen className="size-4 text-primary" />
            Sobre el enfoque {design.approach}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground">
            {design.approach === 'cuantitativo' &&
              'El enfoque cuantitativo utiliza la recoleccion de datos para probar hipotesis con base en la medicion numerica y el analisis estadistico, buscando establecer patrones de comportamiento y probar teorias.'}
            {design.approach === 'cualitativo' &&
              'El enfoque cualitativo utiliza la recoleccion e interpretacion de datos sin medicion numerica para descubrir o afinar preguntas de investigacion. Se basa en la interpretacion y comprension de fenomenos.'}
            {design.approach === 'mixto' &&
              'El enfoque mixto combina metodos cuantitativos y cualitativos en un mismo estudio, permitiendo una comprension mas completa del fenomeno investigado.'}
          </p>
        </CardContent>
      </Card>

      {/* Justificacion */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Justificacion del diseno</Label>
        <Textarea
          value={justification}
          onChange={(e) => handleJustificationChange(e.target.value)}
          placeholder="Explica por que este diseno es el mas adecuado para tu investigacion..."
          rows={5}
          className="resize-y"
        />
        <p className="text-xs text-muted text-right">
          {justification.trim().split(/\s+/).filter(Boolean).length} palabras
        </p>
      </div>

      {/* Micro-defensa */}
      <div className="flex justify-end">
        <MicroDefense
          protocolId={protocol.id}
          step={5}
          onComplete={() => {}}
        />
      </div>
    </div>
  )
}
