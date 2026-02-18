import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Plus, Trash2, Target, AlertTriangle } from 'lucide-react'
import type { Protocol } from '@/types'

interface StepObjectivesProps {
  protocol: Protocol
  onUpdate: (data: Partial<Protocol>) => void
}

const SUGGESTED_VERBS = [
  'Analizar',
  'Determinar',
  'Evaluar',
  'Comparar',
  'Identificar',
  'Describir',
  'Establecer',
  'Verificar',
  'Explicar',
  'Correlacionar',
]

export default function StepObjectives({ protocol, onUpdate }: StepObjectivesProps) {
  const [generalObjective, setGeneralObjective] = useState(protocol.general_objective || '')
  const [specificObjectives, setSpecificObjectives] = useState<string[]>(
    protocol.specific_objectives?.length ? protocol.specific_objectives : ['', '']
  )

  function handleGeneralChange(value: string) {
    setGeneralObjective(value)
    onUpdate({ general_objective: value })
  }

  function handleSpecificChange(index: number, value: string) {
    const updated = [...specificObjectives]
    updated[index] = value
    setSpecificObjectives(updated)
    onUpdate({ specific_objectives: updated })
  }

  function addSpecificObjective() {
    if (specificObjectives.length >= 4) return
    const updated = [...specificObjectives, '']
    setSpecificObjectives(updated)
    onUpdate({ specific_objectives: updated })
  }

  function removeSpecificObjective(index: number) {
    if (specificObjectives.length <= 2) return
    const updated = specificObjectives.filter((_, i) => i !== index)
    setSpecificObjectives(updated)
    onUpdate({ specific_objectives: updated })
  }

  function insertVerb(verb: string) {
    // Insertar verbo al inicio del objetivo general si esta vacio
    if (!generalObjective.trim()) {
      handleGeneralChange(verb + ' ')
    }
  }

  const hasGeneralObjective = generalObjective.trim().length > 0
  const filledSpecific = specificObjectives.filter((o) => o.trim().length > 0).length
  const hasMinSpecific = filledSpecific >= 2

  return (
    <div className="space-y-6">
      {/* Objetivo general */}
      <div className="space-y-3">
        <Label htmlFor="general-objective" className="text-base font-semibold">
          Objetivo General
        </Label>
        <p className="text-sm text-muted">
          Define el proposito principal de tu investigacion. Debe ser coherente con tu pregunta
          de investigacion.
        </p>
        <Input
          id="general-objective"
          value={generalObjective}
          onChange={(e) => handleGeneralChange(e.target.value)}
          placeholder="Ej: Determinar la relacion entre..."
          error={generalObjective.length > 0 && !hasGeneralObjective}
        />
      </div>

      {/* Verbos sugeridos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-muted">
            <Target className="size-4" />
            Verbos sugeridos para objetivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_VERBS.map((verb) => (
              <Badge
                key={verb}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
                onClick={() => insertVerb(verb)}
              >
                {verb}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Objetivos especificos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-semibold">Objetivos Especificos</Label>
            <p className="text-sm text-muted mt-1">
              Define entre 2 y 4 objetivos especificos que desglosen el objetivo general.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addSpecificObjective}
            disabled={specificObjectives.length >= 4}
            className="gap-1"
          >
            <Plus className="size-3.5" />
            Agregar
          </Button>
        </div>

        <div className="space-y-3">
          {specificObjectives.map((obj, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-medium text-muted mt-1">
                {index + 1}
              </span>
              <Input
                value={obj}
                onChange={(e) => handleSpecificChange(index, e.target.value)}
                placeholder={`Objetivo especifico ${index + 1}`}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSpecificObjective(index)}
                disabled={specificObjectives.length <= 2}
                className="shrink-0 mt-0.5 text-muted hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        {!hasMinSpecific && specificObjectives.some((o) => o.length > 0) && (
          <Alert variant="warning" icon={<AlertTriangle className="size-4" />}>
            <AlertDescription className="text-sm">
              Necesitas al menos 2 objetivos especificos completos.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
