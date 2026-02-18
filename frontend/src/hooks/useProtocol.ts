import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Protocol, ApiResponse, Validation } from '@/types'

// Obtener un protocolo por ID
export function useProtocolQuery(id: number | undefined) {
  return useQuery({
    queryKey: ['protocols', id],
    queryFn: () => api.get<ApiResponse<Protocol>>(`/protocols/${id}`),
    select: (data) => data.data,
    enabled: !!id,
  })
}

// Crear protocolo
interface CreateProtocolData {
  session_id: number
}

export function useCreateProtocol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProtocolData) =>
      api.post<ApiResponse<Protocol>>('/protocols', data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['protocols'] })
      queryClient.invalidateQueries({
        queryKey: ['sessions', response.data.session_id],
      })
    },
  })
}

// Actualizar protocolo (guardar progreso parcial)
interface UpdateProtocolData {
  id: number
  data: Partial<
    Pick<
      Protocol,
      | 'problem_statement'
      | 'research_question'
      | 'general_objective'
      | 'specific_objectives'
      | 'hypothesis'
      | 'variables'
      | 'research_design'
      | 'sample'
      | 'instruments'
      | 'theoretical_framework'
      | 'justification'
      | 'current_step'
    >
  >
}

export function useUpdateProtocol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: UpdateProtocolData) =>
      api.put<ApiResponse<Protocol>>(`/protocols/${id}`, data),
    onSuccess: (response) => {
      queryClient.setQueryData(
        ['protocols', response.data.id],
        response
      )
      queryClient.invalidateQueries({ queryKey: ['protocols'] })
    },
  })
}

// Validar protocolo con IA
export function useValidateProtocol() {
  return useMutation({
    mutationFn: (protocolId: number) =>
      api.post<ApiResponse<Validation[]>>(
        `/protocols/${protocolId}/validate`
      ),
  })
}

// Enviar protocolo para revision
export function useSubmitProtocol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (protocolId: number) =>
      api.post<ApiResponse<Protocol>>(`/protocols/${protocolId}/submit`),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ['protocols', response.data.id],
      })
      queryClient.invalidateQueries({ queryKey: ['protocols'] })
      queryClient.invalidateQueries({ queryKey: ['progress'] })
    },
  })
}
