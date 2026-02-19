import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Resource, ApiResponse } from '@/types'

interface ResourceFilters {
  type?: string
  category?: string
  search?: string
}

// Obtener recursos con filtros del backend
export function useResourcesQuery(filters?: ResourceFilters) {
  return useQuery({
    queryKey: ['resources', filters],
    queryFn: () =>
      api.get<ApiResponse<Resource[]>>('/resources', {
        type: filters?.type && filters.type !== 'todas' ? filters.type : undefined,
        category: filters?.category && filters.category !== 'todas' ? filters.category : undefined,
        search: filters?.search || undefined,
      }),
    select: (data) => data.data,
  })
}
