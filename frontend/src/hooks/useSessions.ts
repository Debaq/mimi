import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Session, ApiResponse, User } from '@/types'

// Obtener lista de sesiones
export function useSessionsQuery() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get<ApiResponse<Session[]>>('/sessions'),
    select: (data) => data.data,
  })
}

// Obtener una sesion por ID
export function useSessionQuery(id: number | undefined) {
  return useQuery({
    queryKey: ['sessions', id],
    queryFn: () => api.get<ApiResponse<Session>>(`/sessions/${id}`),
    select: (data) => data.data,
    enabled: !!id,
  })
}

// Crear sesion
interface CreateSessionData {
  title: string
  description: string
  mode: Session['mode']
  difficulty: Session['difficulty']
  problem_statement: string
  start_date: string
  end_date: string
  allow_retries: boolean
  show_hints: boolean
  config?: Record<string, unknown>
}

export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSessionData) =>
      api.post<ApiResponse<Session>>('/sessions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

// Unirse a una sesion (estudiante)
interface JoinSessionData {
  code: string
}

export function useJoinSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: JoinSessionData) =>
      api.post<ApiResponse<Session>>('/sessions/join', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

// Obtener estudiantes de una sesion
export function useSessionStudents(sessionId: number | undefined) {
  return useQuery({
    queryKey: ['sessions', sessionId, 'students'],
    queryFn: () =>
      api.get<ApiResponse<User[]>>(`/sessions/${sessionId}/students`),
    select: (data) => data.data,
    enabled: !!sessionId,
  })
}
