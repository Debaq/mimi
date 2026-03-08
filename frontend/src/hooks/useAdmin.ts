import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ApiResponse, User } from '@/types'

interface AdminUsersParams {
  page?: number
  limit?: number
  role?: string
  search?: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

interface AdminUsersResponse {
  success: boolean
  data: {
    users: User[]
    pagination: PaginationInfo
  }
}

interface AdminStatsResponse {
  success: boolean
  data: {
    total_users: number
    users_by_role: { estudiante: number; docente: number; admin: number }
    total_sessions: number
    active_sessions: number
    total_protocols: number
    recent_users: Pick<User, 'id' | 'name' | 'email' | 'role' | 'created_at'>[]
  }
}

interface CreateUserData {
  name: string
  email: string
  role: 'estudiante' | 'docente' | 'admin'
  password?: string
}

interface UpdateUserData {
  name?: string
  email?: string
  role?: 'estudiante' | 'docente' | 'admin'
  password?: string
}

interface UserMutationResponse {
  success: boolean
  data: { user: User; temp_password?: string }
  message: string
}

export function useAdminStatsQuery() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get<AdminStatsResponse>('/admin/stats'),
  })
}

export function useAdminUsersQuery(params: AdminUsersParams = {}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () =>
      api.get<AdminUsersResponse>('/admin/users', {
        page: String(params.page || 1),
        limit: String(params.limit || 10),
        role: params.role || undefined,
        search: params.search || undefined,
      }),
  })
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserData) =>
      api.post<UserMutationResponse>('/admin/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateUserData & { id: number }) =>
      api.put<UserMutationResponse>(`/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete<ApiResponse<null>>(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}
