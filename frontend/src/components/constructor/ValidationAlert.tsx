import { useState } from 'react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert'
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import type { Validation } from '@/types'

interface ValidationAlertProps {
  validations: Validation[]
}

const variantMap: Record<Validation['status'], 'success' | 'warning' | 'destructive'> = {
  valido: 'success',
  incompleto: 'warning',
  incoherente: 'destructive',
}

const iconMap: Record<Validation['status'], React.ReactNode> = {
  valido: <CheckCircle className="size-5" />,
  incompleto: <AlertTriangle className="size-5" />,
  incoherente: <XCircle className="size-5" />,
}

const labelMap: Record<Validation['status'], string> = {
  valido: 'Correcto',
  incompleto: 'Incompleto',
  incoherente: 'Incoherente',
}

export default function ValidationAlert({ validations }: ValidationAlertProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  if (validations.length === 0) return null

  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-3">
      {validations.map((v) => (
        <Alert key={v.id} variant={variantMap[v.status]} icon={iconMap[v.status]}>
          <div>
            <AlertTitle className="flex items-center justify-between">
              <span>{labelMap[v.status]}: {v.field}</span>
              {v.suggestion && (
                <button
                  type="button"
                  onClick={() => toggleExpand(v.id)}
                  className="ml-2 text-muted hover:text-foreground transition-colors"
                >
                  {expandedIds.has(v.id) ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </button>
              )}
            </AlertTitle>
            <AlertDescription>{v.message}</AlertDescription>
            {expandedIds.has(v.id) && v.suggestion && (
              <div className="mt-2 rounded-lg bg-background/50 p-3 text-sm text-foreground">
                <span className="font-medium">Sugerencia: </span>
                {v.suggestion}
              </div>
            )}
          </div>
        </Alert>
      ))}
    </div>
  )
}
