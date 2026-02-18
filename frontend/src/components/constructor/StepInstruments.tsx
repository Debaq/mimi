import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Select, SelectOption } from '@/components/ui/Select'
import { Separator } from '@/components/ui/Separator'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Plus, Trash2, ClipboardList, AlertTriangle } from 'lucide-react'
import MicroDefense from './MicroDefense'
import type { Protocol, Instrument } from '@/types'

interface StepInstrumentsProps {
  protocol: Protocol
  onUpdate: (data: Partial<Protocol>) => void
}

const INSTRUMENT_TYPES = [
  { value: 'cuestionario', label: 'Cuestionario' },
  { value: 'entrevista', label: 'Entrevista' },
  { value: 'observacion', label: 'Observacion' },
  { value: 'test', label: 'Test' },
  { value: 'escala', label: 'Escala' },
  { value: 'ficha de registro', label: 'Ficha de registro' },
]

function createEmptyInstrument(): Instrument {
  return {
    name: '',
    type: '',
    description: '',
    variables_measured: [],
  }
}

export default function StepInstruments({ protocol, onUpdate }: StepInstrumentsProps) {
  const [instruments, setInstruments] = useState<Instrument[]>(
    protocol.instruments?.length ? protocol.instruments : [createEmptyInstrument()]
  )

  const variableNames = (protocol.variables || []).map((v) => v.name).filter(Boolean)

  // Verificar que cada variable tenga al menos un instrumento
  const coveredVariables = new Set(instruments.flatMap((i) => i.variables_measured))
  const uncoveredVariables = variableNames.filter((v) => !coveredVariables.has(v))

  function updateInstruments(updated: Instrument[]) {
    setInstruments(updated)
    onUpdate({ instruments: updated })
  }

  function handleFieldChange(index: number, field: keyof Instrument, value: string | string[]) {
    const updated = [...instruments]
    updated[index] = { ...updated[index], [field]: value }
    updateInstruments(updated)
  }

  function toggleVariable(instrumentIndex: number, variableName: string) {
    const current = instruments[instrumentIndex].variables_measured
    const updated = current.includes(variableName)
      ? current.filter((v) => v !== variableName)
      : [...current, variableName]
    handleFieldChange(instrumentIndex, 'variables_measured', updated)
  }

  function addInstrument() {
    updateInstruments([...instruments, createEmptyInstrument()])
  }

  function removeInstrument(index: number) {
    if (instruments.length <= 1) return
    updateInstruments(instruments.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold flex items-center gap-2">
            <ClipboardList className="size-5 text-primary" />
            Instrumentos de recoleccion
          </Label>
          <p className="text-sm text-muted mt-1">
            Define los instrumentos que utilizaras para medir cada variable de tu investigacion.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addInstrument} className="gap-1">
          <Plus className="size-3.5" />
          Agregar instrumento
        </Button>
      </div>

      {/* Alerta de variables sin instrumento */}
      {uncoveredVariables.length > 0 && (
        <Alert variant="warning" icon={<AlertTriangle className="size-4" />}>
          <AlertDescription className="text-sm">
            Las siguientes variables no tienen instrumento asignado:{' '}
            <strong>{uncoveredVariables.join(', ')}</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de instrumentos */}
      <div className="space-y-4">
        {instruments.map((instrument, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-card p-5 space-y-4 transition-all duration-200 hover:shadow-sm"
          >
            {/* Encabezado */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                Instrumento {index + 1}
                {instrument.name && (
                  <span className="ml-2 font-normal text-muted">- {instrument.name}</span>
                )}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeInstrument(index)}
                disabled={instruments.length <= 1}
                className="text-muted hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            {/* Nombre y tipo */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm">Nombre del instrumento</Label>
                <Input
                  value={instrument.name}
                  onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                  placeholder="Ej: Cuestionario de satisfaccion"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Tipo de instrumento</Label>
                <Select
                  value={instrument.type}
                  onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                >
                  <SelectOption value="" disabled>
                    Seleccionar tipo
                  </SelectOption>
                  {INSTRUMENT_TYPES.map((t) => (
                    <SelectOption key={t.value} value={t.value}>
                      {t.label}
                    </SelectOption>
                  ))}
                </Select>
              </div>
            </div>

            {/* Descripcion */}
            <div className="space-y-2">
              <Label className="text-sm">Descripcion del instrumento</Label>
              <Textarea
                value={instrument.description}
                onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                placeholder="Describe el instrumento, sus secciones, numero de items, tipo de escala..."
                rows={3}
                className="resize-none"
              />
            </div>

            <Separator />

            {/* Variables medidas (checkboxes) */}
            <div className="space-y-2">
              <Label className="text-sm">Variables que mide este instrumento</Label>
              {variableNames.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {variableNames.map((varName) => {
                    const isSelected = instrument.variables_measured.includes(varName)
                    return (
                      <button
                        key={varName}
                        type="button"
                        onClick={() => toggleVariable(index, varName)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-all duration-200 ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-border bg-card text-muted hover:border-primary/50 hover:text-foreground'
                        }`}
                      >
                        <span
                          className={`size-3.5 rounded border transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary'
                              : 'border-border'
                          } flex items-center justify-center`}
                        >
                          {isSelected && (
                            <svg
                              className="size-2.5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        {varName}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted italic">
                  No hay variables definidas. Define las variables en el paso 4.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Micro-defensa */}
      <div className="flex justify-end">
        <MicroDefense
          protocolId={protocol.id}
          step={7}
          onComplete={() => {}}
        />
      </div>
    </div>
  )
}
