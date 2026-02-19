import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { DefenseSession, ApiResponse } from '@/types'

// Obtener defensas de un protocolo
export function useDefensesByProtocol(protocolId: number | undefined) {
  return useQuery({
    queryKey: ['defense-sessions', 'protocol', protocolId],
    queryFn: () =>
      api.get<ApiResponse<DefenseSession[]>>(
        `/defense/protocol/${protocolId}`
      ),
    select: (data) => data.data,
    enabled: !!protocolId,
  })
}

// Obtener una sesion de defensa por ID
export function useDefenseSession(sessionId: number | undefined) {
  return useQuery({
    queryKey: ['defense-sessions', sessionId],
    queryFn: () =>
      api.get<ApiResponse<DefenseSession>>(`/defense/${sessionId}`),
    select: (data) => data.data,
    enabled: !!sessionId,
  })
}

// Iniciar defensa
export function useStartDefense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (protocolId: number) =>
      api.post<ApiResponse<DefenseSession>>('/defense/start', {
        protocol_id: protocolId,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ['defense-sessions', 'protocol', response.data.protocol_id],
      })
    },
  })
}

// Responder pregunta
interface AnswerDefenseData {
  sessionId: number
  question_index: number
  answer: string
}

export function useAnswerDefense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, question_index, answer }: AnswerDefenseData) =>
      api.post<
        ApiResponse<{
          question_index: number
          score: number
          answers: string[]
          scores: number[]
        }>
      >(`/defense/${sessionId}/answer`, { question_index, answer }),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['defense-sessions', variables.sessionId],
      })
    },
  })
}

// Finalizar defensa
interface FinishDefenseData {
  sessionId: number
  time_spent: number
}

export function useFinishDefense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, time_spent }: FinishDefenseData) =>
      api.post<
        ApiResponse<{
          session: DefenseSession
          xp_earned: number
        }>
      >(`/defense/${sessionId}/finish`, { time_spent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defense-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['progress'] })
    },
  })
}
