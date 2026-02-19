import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  DetectiveCase,
  DetectiveAttempt,
  DetectiveAnnotation,
  DetectiveSubmitResponse,
  DetectiveHintResponse,
  ApiResponse,
} from '@/types'

// Obtener casos de una sesion detective
export function useDetectiveCases(sessionId: number | undefined) {
  return useQuery({
    queryKey: ['detective', 'cases', sessionId],
    queryFn: () =>
      api.get<ApiResponse<DetectiveCase[]>>(`/detective/cases/${sessionId}`),
    select: (data) => data.data,
    enabled: !!sessionId,
  })
}

// Crear un intento para un caso
export function useStartDetectiveAttempt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (caseId: number) =>
      api.post<ApiResponse<DetectiveAttempt>>('/detective/attempts', {
        case_id: caseId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detective'] })
    },
  })
}

// Actualizar anotaciones de un intento
interface UpdateAnnotationsData {
  attemptId: number
  annotations: DetectiveAnnotation[]
  time_spent?: number
}

export function useUpdateDetectiveAnnotations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ attemptId, annotations, time_spent }: UpdateAnnotationsData) =>
      api.put<ApiResponse<DetectiveAttempt>>(`/detective/attempts/${attemptId}`, {
        annotations,
        time_spent,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detective'] })
    },
  })
}

// Enviar intento para evaluacion
export function useSubmitDetectiveAttempt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (attemptId: number) =>
      api.post<ApiResponse<DetectiveSubmitResponse>>(
        `/detective/attempts/${attemptId}/submit`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detective'] })
      queryClient.invalidateQueries({ queryKey: ['progress'] })
    },
  })
}

// Obtener pista
export function useDetectiveHint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (attemptId: number) =>
      api.get<ApiResponse<DetectiveHintResponse>>(
        `/detective/attempts/${attemptId}/hint`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detective'] })
    },
  })
}
