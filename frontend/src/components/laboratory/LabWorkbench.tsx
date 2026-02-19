import { useState, useCallback } from 'react'
import {
  Calculator,
  Send,
  Save,
  BarChart3,
  ScatterChart,
  Trash2,
  FlaskConical,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import DataTable from '@/components/laboratory/DataTable'
import StatChart from '@/components/laboratory/StatChart'
import {
  useCalculateStats,
  useSaveProgress,
  useSubmitAnalysis,
} from '@/hooks/useLaboratory'
import type { LabExperiment, LabAttempt } from '@/types'

interface LabWorkbenchProps {
  experiment: LabExperiment
  attempt: LabAttempt
  onSubmitted: (result: { score: number; xp_earned: number }) => void
}

interface CalculationResult {
  id: string
  operation: string
  columnName: string
  columnIndex: number
  columnName2?: string
  columnIndex2?: number
  value: unknown
  timestamp: number
}

const OPERATIONS = [
  { id: 'media', label: 'Media', icon: Calculator, needsTwoCols: false },
  { id: 'mediana', label: 'Mediana', icon: Calculator, needsTwoCols: false },
  { id: 'moda', label: 'Moda', icon: Calculator, needsTwoCols: false },
  {
    id: 'desviacion_estandar',
    label: 'Desv. Estandar',
    icon: Calculator,
    needsTwoCols: false,
  },
  { id: 'varianza', label: 'Varianza', icon: Calculator, needsTwoCols: false },
  { id: 'min', label: 'Minimo', icon: Calculator, needsTwoCols: false },
  { id: 'max', label: 'Maximo', icon: Calculator, needsTwoCols: false },
  { id: 'rango', label: 'Rango', icon: Calculator, needsTwoCols: false },
  {
    id: 'frecuencias',
    label: 'Frecuencias',
    icon: BarChart3,
    needsTwoCols: false,
  },
  {
    id: 'correlacion',
    label: 'Correlacion',
    icon: ScatterChart,
    needsTwoCols: true,
  },
]

export default function LabWorkbench({
  experiment,
  attempt,
  onSubmitted,
}: LabWorkbenchProps) {
  const [selectedColumns, setSelectedColumns] = useState<number[]>([])
  const [calculations, setCalculations] = useState<CalculationResult[]>(() => {
    // Restaurar calculos previos si hay
    const existing = attempt.analysis_results || {}
    const restored: CalculationResult[] = []
    Object.entries(existing).forEach(([key, value]) => {
      restored.push({
        id: key,
        operation: key.split('_')[0] || key,
        columnName: key,
        columnIndex: 0,
        value,
        timestamp: Date.now(),
      })
    })
    return restored
  })
  const [interpretation, setInterpretation] = useState(
    attempt.interpretation || ''
  )
  const [activeTab, setActiveTab] = useState('datos')

  const calculateStats = useCalculateStats()
  const saveProgress = useSaveProgress()
  const submitAnalysis = useSubmitAnalysis()

  const handleColumnSelect = useCallback(
    (index: number) => {
      setSelectedColumns((prev) => {
        if (prev.includes(index)) {
          return prev.filter((i) => i !== index)
        }
        // Maximo 2 columnas seleccionadas
        if (prev.length >= 2) {
          return [prev[1], index]
        }
        return [...prev, index]
      })
    },
    []
  )

  function handleCalculate(operationId: string) {
    const op = OPERATIONS.find((o) => o.id === operationId)
    if (!op) return

    if (selectedColumns.length === 0) return

    if (op.needsTwoCols && selectedColumns.length < 2) return

    const colIndex = selectedColumns[0]
    const colIndex2 =
      op.needsTwoCols && selectedColumns.length >= 2
        ? selectedColumns[1]
        : undefined

    calculateStats.mutate(
      {
        dataset: experiment.dataset,
        operations: [operationId],
        column_index: colIndex,
        column_index_2: colIndex2,
      },
      {
        onSuccess: (response) => {
          const resultValue = response.data[operationId]
          const colName = experiment.dataset_headers[colIndex]
          const colName2 =
            colIndex2 !== undefined
              ? experiment.dataset_headers[colIndex2]
              : undefined

          const resultKey = colName2
            ? `${operationId}_${colName}_${colName2}`
            : `${operationId}_${colName}`

          const newCalc: CalculationResult = {
            id: resultKey,
            operation: operationId,
            columnName: colName,
            columnIndex: colIndex,
            columnName2: colName2,
            columnIndex2: colIndex2,
            value: resultValue,
            timestamp: Date.now(),
          }

          setCalculations((prev) => {
            // Reemplazar si ya existe la misma clave
            const filtered = prev.filter((c) => c.id !== resultKey)
            return [...filtered, newCalc]
          })
        },
      }
    )
  }

  function handleRemoveCalc(id: string) {
    setCalculations((prev) => prev.filter((c) => c.id !== id))
  }

  function buildAnalysisResults(): Record<string, unknown> {
    const results: Record<string, unknown> = {}
    calculations.forEach((calc) => {
      results[calc.id] = calc.value
    })
    return results
  }

  function handleSave() {
    saveProgress.mutate({
      attemptId: attempt.id,
      analysis_results: buildAnalysisResults(),
      interpretation,
    })
  }

  function handleSubmit() {
    // Primero guardar y luego enviar
    saveProgress.mutate(
      {
        attemptId: attempt.id,
        analysis_results: buildAnalysisResults(),
        interpretation,
      },
      {
        onSuccess: () => {
          submitAnalysis.mutate(attempt.id, {
            onSuccess: (response) => {
              onSubmitted({
                score: response.data.score,
                xp_earned: response.data.xp_earned,
              })
            },
          })
        },
      }
    )
  }

  // Preparar datos para graficos
  const frequencyCalcs = calculations.filter(
    (c) => c.operation === 'frecuencias' && Array.isArray(c.value)
  )
  const correlationCalcs = calculations.filter(
    (c) => c.operation === 'correlacion'
  )
  const descriptiveCalcs = calculations.filter(
    (c) =>
      c.operation !== 'frecuencias' &&
      c.operation !== 'correlacion' &&
      (typeof c.value === 'number' || c.value === null)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FlaskConical className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {experiment.title}
            </h1>
            <p className="text-sm text-muted">Laboratorio Estadistico</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saveProgress.isPending}
          >
            <Save className="h-3.5 w-3.5" />
            {saveProgress.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={
              submitAnalysis.isPending ||
              saveProgress.isPending ||
              calculations.length === 0
            }
          >
            <Send className="h-3.5 w-3.5" />
            {submitAnalysis.isPending ? 'Enviando...' : 'Enviar analisis'}
          </Button>
        </div>
      </div>

      {/* Instrucciones */}
      {experiment.instructions && (
        <Alert icon={<Info />}>
          <AlertTitle>Instrucciones</AlertTitle>
          <AlertDescription>{experiment.instructions}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="datos">Datos</TabsTrigger>
          <TabsTrigger value="herramientas">Herramientas</TabsTrigger>
          <TabsTrigger value="resultados">
            Resultados ({calculations.length})
          </TabsTrigger>
          <TabsTrigger value="interpretacion">Interpretacion</TabsTrigger>
        </TabsList>

        {/* Tab: Datos */}
        <TabsContent value="datos">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">
                  Haz clic en los encabezados de columna para seleccionar datos.
                </p>
                {selectedColumns.length > 0 && (
                  <p className="text-xs text-primary mt-1">
                    {selectedColumns.length} columna(s) seleccionada(s):{' '}
                    {selectedColumns
                      .map((i) => experiment.dataset_headers[i])
                      .join(', ')}
                  </p>
                )}
              </div>
              {selectedColumns.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedColumns([])}
                >
                  Limpiar seleccion
                </Button>
              )}
            </div>

            <DataTable
              headers={experiment.dataset_headers}
              data={experiment.dataset}
              selectedColumns={selectedColumns}
              onColumnSelect={handleColumnSelect}
            />
          </div>
        </TabsContent>

        {/* Tab: Herramientas */}
        <TabsContent value="herramientas">
          <div className="space-y-4">
            {selectedColumns.length === 0 && (
              <Alert variant="warning" icon={<Info />}>
                <AlertTitle>Selecciona columnas primero</AlertTitle>
                <AlertDescription>
                  Ve a la pestana &quot;Datos&quot; y haz clic en los
                  encabezados de columna para seleccionar los datos sobre los
                  que deseas calcular.
                </AlertDescription>
              </Alert>
            )}

            {selectedColumns.length > 0 && (
              <div className="rounded-xl bg-secondary/50 p-3">
                <p className="text-xs text-muted mb-1">
                  Columnas seleccionadas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedColumns.map((i) => (
                    <Badge key={i} variant="default">
                      {experiment.dataset_headers[i]}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {OPERATIONS.map((op) => {
                const disabled =
                  selectedColumns.length === 0 ||
                  (op.needsTwoCols && selectedColumns.length < 2)

                return (
                  <Button
                    key={op.id}
                    variant="outline"
                    size="sm"
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    disabled={disabled || calculateStats.isPending}
                    onClick={() => handleCalculate(op.id)}
                  >
                    <op.icon className="h-4 w-4" />
                    <span className="text-xs">{op.label}</span>
                    {op.needsTwoCols && (
                      <span className="text-[10px] text-muted">
                        (2 cols)
                      </span>
                    )}
                  </Button>
                )
              })}
            </div>

            {calculateStats.isPending && (
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="ml-2 text-sm text-muted">Calculando...</span>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab: Resultados */}
        <TabsContent value="resultados">
          <div className="space-y-4">
            {calculations.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center py-12">
                  <BarChart3 className="h-8 w-8 text-muted mb-3" />
                  <p className="text-sm text-muted text-center">
                    Aun no has realizado calculos. Selecciona columnas y usa las
                    herramientas para comenzar tu analisis.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Estadisticas descriptivas */}
                {descriptiveCalcs.length > 0 && (
                  <StatChart
                    type="histogram"
                    title="Estadisticas descriptivas"
                    descriptive={descriptiveCalcs.map((c) => ({
                      label: `${c.operation.replace(/_/g, ' ')} (${c.columnName})`,
                      value:
                        c.value !== null && c.value !== undefined
                          ? (c.value as number)
                          : 'N/A',
                    }))}
                  />
                )}

                {/* Histogramas de frecuencias */}
                {frequencyCalcs.map((calc) => (
                  <StatChart
                    key={calc.id}
                    type="histogram"
                    title={`Frecuencias - ${calc.columnName}`}
                    data={
                      calc.value as Array<{
                        valor: number
                        frecuencia_absoluta: number
                        frecuencia_relativa: number
                        porcentaje: number
                      }>
                    }
                  />
                ))}

                {/* Scatter plots */}
                {correlationCalcs.map((calc) => {
                  if (
                    calc.columnIndex2 === undefined ||
                    calc.columnIndex2 === null
                  )
                    return null

                  const xData: number[] = []
                  const yData: number[] = []
                  experiment.dataset.forEach((row) => {
                    const xv = row[calc.columnIndex]
                    const yv = row[calc.columnIndex2 as number]
                    if (
                      typeof xv === 'number' &&
                      typeof yv === 'number'
                    ) {
                      xData.push(xv)
                      yData.push(yv)
                    }
                  })

                  return (
                    <div key={calc.id} className="space-y-2">
                      <StatChart
                        type="scatter"
                        title={`Correlacion: ${calc.columnName} vs ${calc.columnName2} (r = ${calc.value})`}
                        scatterData={{
                          x: xData,
                          y: yData,
                          headerX: calc.columnName,
                          headerY: calc.columnName2 || '',
                        }}
                      />
                    </div>
                  )
                })}

                {/* Lista de todos los calculos */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Todos los calculos ({calculations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {calculations.map((calc) => (
                        <div
                          key={calc.id}
                          className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs text-muted">
                              {calc.operation.replace(/_/g, ' ')}
                            </span>
                            <span className="mx-1 text-xs text-muted">
                              -
                            </span>
                            <span className="text-xs font-medium text-foreground">
                              {calc.columnName}
                              {calc.columnName2 &&
                                ` vs ${calc.columnName2}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium text-foreground">
                              {calc.operation === 'frecuencias'
                                ? `${(calc.value as Array<unknown>).length} valores`
                                : typeof calc.value === 'number'
                                  ? Number.isInteger(calc.value)
                                    ? calc.value
                                    : Number(calc.value).toFixed(4)
                                  : Array.isArray(calc.value)
                                    ? (calc.value as number[]).join(', ')
                                    : String(calc.value ?? 'N/A')}
                            </span>
                            <button
                              onClick={() => handleRemoveCalc(calc.id)}
                              className="p-1 rounded hover:bg-destructive/10 text-muted hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* Tab: Interpretacion */}
        <TabsContent value="interpretacion">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Interpretacion de resultados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted mb-3">
                  Escribe tu interpretacion de los datos y los resultados
                  obtenidos. Explica que significan los valores calculados,
                  identifica patrones o tendencias, y presenta tus
                  conclusiones.
                </p>
                <Textarea
                  value={interpretation}
                  onChange={(e) => setInterpretation(e.target.value)}
                  placeholder="Escribe aqui tu interpretacion de los datos analizados. Considera:&#10;- Que indican las medidas de tendencia central?&#10;- Existe alguna correlacion entre las variables?&#10;- Que patrones o tendencias observas?&#10;- Cuales son tus conclusiones?"
                  className="min-h-[240px]"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted">
                    {interpretation.length} caracteres
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={saveProgress.isPending}
                  >
                    <Save className="h-3.5 w-3.5" />
                    Guardar borrador
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resumen antes de enviar */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Resumen del analisis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Calculos realizados</span>
                  <Badge
                    variant={
                      calculations.length > 0 ? 'success' : 'secondary'
                    }
                  >
                    {calculations.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Interpretacion</span>
                  <Badge
                    variant={
                      interpretation.length > 20 ? 'success' : 'secondary'
                    }
                  >
                    {interpretation.length > 20
                      ? 'Escrita'
                      : 'Pendiente'}
                  </Badge>
                </div>

                <div className="pt-3 border-t border-border">
                  <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={
                      submitAnalysis.isPending ||
                      saveProgress.isPending ||
                      calculations.length === 0
                    }
                  >
                    <Send className="h-4 w-4" />
                    {submitAnalysis.isPending
                      ? 'Enviando analisis...'
                      : 'Enviar analisis final'}
                  </Button>
                  <p className="text-[11px] text-muted text-center mt-2">
                    Una vez enviado, no podras modificar tus resultados.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
