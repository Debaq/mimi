import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface FrequencyItem {
  valor: number
  frecuencia_absoluta: number
  frecuencia_relativa: number
  porcentaje: number
}

interface StatChartProps {
  type: 'histogram' | 'scatter'
  title: string
  data?: FrequencyItem[]
  scatterData?: { x: number[]; y: number[]; headerX: string; headerY: string }
  descriptive?: {
    label: string
    value: string | number
  }[]
}

export default function StatChart({
  type,
  title,
  data,
  scatterData,
  descriptive,
}: StatChartProps) {
  if (type === 'histogram' && data && data.length > 0) {
    const maxFreq = Math.max(...data.map((d) => d.frecuencia_absoluta))

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {data.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-16 text-right text-xs font-mono text-muted shrink-0">
                  {item.valor}
                </span>
                <div className="flex-1 h-5 bg-secondary/50 rounded overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded transition-all duration-300"
                    style={{
                      width: `${(item.frecuencia_absoluta / maxFreq) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-8 text-xs text-muted shrink-0">
                  {item.frecuencia_absoluta}
                </span>
                <span className="w-14 text-right text-xs text-muted shrink-0">
                  {item.porcentaje}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (type === 'scatter' && scatterData) {
    const { x, y, headerX, headerY } = scatterData
    const n = Math.min(x.length, y.length)
    if (n === 0) return null

    const minX = Math.min(...x)
    const maxX = Math.max(...x)
    const minY = Math.min(...y)
    const maxY = Math.max(...y)
    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1

    const containerW = 280
    const containerH = 200
    const padding = 8

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="relative" style={{ width: containerW, height: containerH }}>
              {/* Ejes */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
              <div className="absolute top-0 bottom-0 left-0 w-px bg-border" />

              {/* Puntos */}
              {x.slice(0, n).map((xi, i) => {
                const px =
                  padding +
                  ((xi - minX) / rangeX) * (containerW - padding * 2)
                const py =
                  containerH -
                  padding -
                  ((y[i] - minY) / rangeY) * (containerH - padding * 2)

                return (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-primary"
                    style={{
                      left: px - 4,
                      top: py - 4,
                    }}
                    title={`${headerX}: ${xi}, ${headerY}: ${y[i]}`}
                  />
                )
              })}

              {/* Labels */}
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted">
                {headerX}
              </span>
              <span
                className="absolute -left-5 top-1/2 -translate-y-1/2 text-[10px] text-muted"
                style={{
                  writingMode: 'vertical-lr',
                  transform: 'rotate(180deg) translateY(50%)',
                }}
              >
                {headerY}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (descriptive && descriptive.length > 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {descriptive.map((item, i) => (
              <div
                key={i}
                className="rounded-lg bg-secondary/50 p-3 text-center"
              >
                <div className="text-xs text-muted mb-1">{item.label}</div>
                <div className="text-lg font-bold text-foreground font-mono">
                  {typeof item.value === 'number'
                    ? Number.isInteger(item.value)
                      ? item.value
                      : Number(item.value).toFixed(4)
                    : item.value}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
