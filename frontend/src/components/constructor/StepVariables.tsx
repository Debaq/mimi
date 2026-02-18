import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Select, SelectOption } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'
import { Plus, Trash2, Variable as VariableIcon } from 'lucide-react'
import type { Protocol, Variable } from '@/types'

interface StepVariablesProps {
  protocol: Protocol
  onUpdate: (data: Partial<Protocol>) => void
}

const VARIABLE_TYPES: { value: Variable['type']; label: string; color: string }[] = [
  { value: 'independiente', label: 'Independiente', color: 'bg-primary' },
  { value: 'dependiente', label: 'Dependiente', color: 'bg-accent' },
  { value: 'interviniente', label: 'Interviniente', color: 'bg-warning' },
]

function createEmptyVariable(): Variable {
  return {
    name: '',
    type: 'independiente',
    conceptual_definition: '',
    operational_definition: '',
  }
}

export default function StepVariables({ protocol, onUpdate }: StepVariablesProps) {
  const [variables, setVariables] = useState<Variable[]>(
    protocol.variables?.length ? protocol.variables : [createEmptyVariable()]
  )

  function updateVariables(updated: Variable[]) {
    setVariables(updated)
    onUpdate({ variables: updated })
  }

  function handleFieldChange(index: number, field: keyof Variable, value: string) {
    const updated = [...variables]
    updated[index] = { ...updated[index], [field]: value }
    updateVariables(updated)
  }

  function addVariable() {
    updateVariables([...variables, createEmptyVariable()])
  }

  function removeVariable(index: number) {
    if (variables.length <= 1) return
    updateVariables(variables.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Variables de investigacion</Label>
          <p className="text-sm text-muted mt-1">
            Define las variables que intervienen en tu estudio. Cada variable debe tener una
            definicion conceptual y operacional.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addVariable} className="gap-1">
          <Plus className="size-3.5" />
          Agregar variable
        </Button>
      </div>

      {/* Leyenda de tipos */}
      <div className="flex flex-wrap gap-3">
        {VARIABLE_TYPES.map((t) => (
          <div key={t.value} className="flex items-center gap-1.5 text-xs text-muted">
            <span className={`size-2.5 rounded-full ${t.color}`} />
            {t.label}
          </div>
        ))}
      </div>

      {/* Lista de variables */}
      <div className="space-y-4">
        {variables.map((variable, index) => {
          return (
            <div
              key={index}
              className="rounded-xl border border-border bg-card p-5 space-y-4 transition-all duration-200 hover:shadow-sm"
            >
              {/* Encabezado de variable */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <VariableIcon className="size-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    Variable {index + 1}
                  </span>
                  {variable.name && (
                    <Badge variant="secondary" className="text-xs">
                      {variable.name}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeVariable(index)}
                  disabled={variables.length <= 1}
                  className="text-muted hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              {/* Nombre y tipo */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm">Nombre de la variable</Label>
                  <Input
                    value={variable.name}
                    onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                    placeholder="Ej: Rendimiento academico"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Tipo de variable</Label>
                  <Select
                    value={variable.type}
                    onChange={(e) =>
                      handleFieldChange(index, 'type', e.target.value as Variable['type'])
                    }
                  >
                    {VARIABLE_TYPES.map((t) => (
                      <SelectOption key={t.value} value={t.value}>
                        {t.label}
                      </SelectOption>
                    ))}
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Definiciones */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Definicion conceptual</Label>
                  <Textarea
                    value={variable.conceptual_definition}
                    onChange={(e) =>
                      handleFieldChange(index, 'conceptual_definition', e.target.value)
                    }
                    placeholder="Define la variable desde la teoria..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Definicion operacional</Label>
                  <Textarea
                    value={variable.operational_definition}
                    onChange={(e) =>
                      handleFieldChange(index, 'operational_definition', e.target.value)
                    }
                    placeholder="Define como se medira la variable..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
