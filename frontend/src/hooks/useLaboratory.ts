import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { LabExperiment, LabAttempt, ApiResponse } from '@/types'

// Obtener experimentos de una sesion
export function useLabExperiments(sessionId: number | undefined) {
  return useQuery({
    queryKey: ['lab-experiments', sessionId],
    queryFn: () =>
      api.get<ApiResponse<LabExperiment[]>>(`/lab/experiments/${sessionId}`),
    select: (data) => data.data,
    enabled: !!sessionId,
  })
}

// Crear experimento (docente)
interface CreateExperimentData {
  session_id: number
  title: string
  description?: string
  dataset: number[][]
  dataset_headers: string[]
  expected_analysis?: Record<string, unknown>
  instructions?: string
  difficulty?: number
}

export function useCreateExperiment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateExperimentData) =>
      api.post<ApiResponse<LabExperiment>>('/lab/experiments', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['lab-experiments', variables.session_id],
      })
    },
  })
}

// Iniciar intento
export function useStartAttempt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (experimentId: number) =>
      api.post<ApiResponse<LabAttempt>>('/lab/attempts', {
        experiment_id: experimentId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-experiments'] })
    },
  })
}

// Guardar progreso del intento
interface SaveProgressData {
  attemptId: number
  analysis_results?: Record<string, unknown>
  interpretation?: string
}

export function useSaveProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ attemptId, ...data }: SaveProgressData) =>
      api.put<ApiResponse<LabAttempt>>(`/lab/attempts/${attemptId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-experiments'] })
    },
  })
}

// Enviar analisis
export function useSubmitAnalysis() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (attemptId: number) =>
      api.post<ApiResponse<{ score: number; xp_earned: number; status: string }>>(
        `/lab/attempts/${attemptId}/submit`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-experiments'] })
      queryClient.invalidateQueries({ queryKey: ['progress'] })
    },
  })
}

// Calcular estadisticas via API
interface CalculateData {
  dataset: number[][]
  operations: string[]
  column_index?: number
  column_index_2?: number
}

interface CalculateResult {
  [key: string]: number | null | Array<{
    valor: number
    frecuencia_absoluta: number
    frecuencia_relativa: number
    porcentaje: number
  }>
}

export function useCalculateStats() {
  return useMutation({
    mutationFn: (data: CalculateData) =>
      api.post<ApiResponse<CalculateResult>>('/lab/calculate', data),
  })
}
