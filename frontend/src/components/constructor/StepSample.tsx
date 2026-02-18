import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectOption } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Users, BookOpen } from 'lucide-react'
import MicroDefense from './MicroDefense'
import type { Protocol, Sample } from '@/types'

interface StepSampleProps {
  protocol: Protocol
  onUpdate: (data: Partial<Protocol>) => void
}

const SAMPLING_TECHNIQUES = [
  { value: 'probabilistico aleatorio', label: 'Probabilistico aleatorio' },
  { value: 'estratificado', label: 'Estratificado' },
  { value: 'por conglomerados', label: 'Por conglomerados' },
  { value: 'no probabilistico intencional', label: 'No probabilistico intencional' },
  { value: 'por conveniencia', label: 'Por conveniencia' },
  { value: 'bola de nieve', label: 'Bola de nieve' },
]

export default function StepSample({ protocol, onUpdate }: StepSampleProps) {
  const [sample, setSample] = useState<Sample>(
    protocol.sample || { population: '', size: 0, technique: '', justification: '' }
  )

  function handleChange<K extends keyof Sample>(field: K, value: Sample[K]) {
    const updated = { ...sample, [field]: value }
    setSample(updated)
    onUpdate({ sample: updated })
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold flex items-center gap-2">
          <Users className="size-5 text-primary" />
          Poblacion y Muestra
        </Label>
        <p className="text-sm text-muted mt-1">
          Define la poblacion objetivo de tu estudio, el tamano de la muestra y la tecnica de
          muestreo que utilizaras.
        </p>
      </div>

      {/* Descripcion de la poblacion */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Descripcion de la poblacion</Label>
        <Textarea
          value={sample.population}
          onChange={(e) => handleChange('population', e.target.value)}
          placeholder="Describe la poblacion total a la que se dirige tu estudio (caracteristicas, ubicacion, periodo)..."
          rows={4}
          className="resize-y"
        />
      </div>

      {/* Tamano y tecnica en grid */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tamano de la muestra</Label>
          <Input
            type="number"
            value={sample.size || ''}
            onChange={(e) => handleChange('size', parseInt(e.target.value) || 0)}
            placeholder="Ej: 150"
            min={1}
          />
          <p className="text-xs text-muted">Numero de participantes o unidades de analisis.</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Tecnica de muestreo</Label>
          <Select
            value={sample.technique}
            onChange={(e) => handleChange('technique', e.target.value)}
          >
            <SelectOption value="" disabled>
              Seleccionar tecnica
            </SelectOption>
            {SAMPLING_TECHNIQUES.map((t) => (
              <SelectOption key={t.value} value={t.value}>
                {t.label}
              </SelectOption>
            ))}
          </Select>
        </div>
      </div>

      {/* Informacion de la tecnica seleccionada */}
      {sample.technique && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BookOpen className="size-4 text-primary" />
              Sobre la tecnica seleccionada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">
              {sample.technique === 'probabilistico aleatorio' &&
                'Todos los elementos de la poblacion tienen la misma probabilidad de ser seleccionados. Es ideal cuando se cuenta con un marco muestral completo.'}
              {sample.technique === 'estratificado' &&
                'La poblacion se divide en subgrupos (estratos) y se seleccionan muestras de cada uno. Util cuando la poblacion tiene subgrupos distinguibles.'}
              {sample.technique === 'por conglomerados' &&
                'Se seleccionan grupos completos (conglomerados) en lugar de individuos. Eficiente cuando la poblacion esta naturalmente agrupada.'}
              {sample.technique === 'no probabilistico intencional' &&
                'Los participantes se seleccionan de acuerdo a criterios especificos del investigador. Ideal para estudios cualitativos o exploratorios.'}
              {sample.technique === 'por conveniencia' &&
                'Se seleccionan los casos mas accesibles para el investigador. Aunque practico, limita la generalizacion de resultados.'}
              {sample.technique === 'bola de nieve' &&
                'Los participantes iniciales refieren a otros posibles participantes. Util cuando la poblacion es de dificil acceso o esta oculta.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Justificacion */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Justificacion de la muestra</Label>
        <Textarea
          value={sample.justification}
          onChange={(e) => handleChange('justification', e.target.value)}
          placeholder="Explica por que seleccionaste este tamano de muestra y tecnica de muestreo..."
          rows={4}
          className="resize-y"
        />
        <p className="text-xs text-muted text-right">
          {sample.justification.trim().split(/\s+/).filter(Boolean).length} palabras
        </p>
      </div>

      {/* Micro-defensa */}
      <div className="flex justify-end">
        <MicroDefense
          protocolId={protocol.id}
          step={6}
          onComplete={() => {}}
        />
      </div>
    </div>
  )
}
