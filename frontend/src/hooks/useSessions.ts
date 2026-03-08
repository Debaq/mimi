import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Session, ApiResponse, User } from '@/types'

// Obtener lista de sesiones con filtros opcionales
export function useSessionsQuery(filters?: { status?: string }) {
  return useQuery({
    queryKey: ['sessions', filters],
    queryFn: () => api.get<ApiResponse<Session[]>>('/sessions', {
      status: filters?.status,
    }),
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
  status?: Session['status']
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

// Actualizar sesion
export function useUpdateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<CreateSessionData & { status: Session['status'] }>) =>
      api.put<ApiResponse<Session>>(`/sessions/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.id] })
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

// Eliminar sesion
export function useDeleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      api.delete<ApiResponse<null>>(`/sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
