import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ProgressInfo, ApiResponse, ActivityLog, Badge } from '@/types'

interface Level {
  level: number
  min_xp: number
  max_xp: number
  title: string
}

// Obtener mi progreso (nivel, XP, insignias)
export function useProgressQuery() {
  return useQuery({
    queryKey: ['progress'],
    queryFn: () => api.get<ApiResponse<ProgressInfo>>('/progress/me'),
    select: (data) => data.data,
  })
}

// Obtener tabla de niveles
export function useLevelsQuery() {
  return useQuery({
    queryKey: ['levels'],
    queryFn: () => api.get<ApiResponse<Level[]>>('/progress/levels'),
    select: (data) => data.data,
  })
}

// Obtener mi registro de actividad
export function useActivityQuery() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: () => api.get<ApiResponse<ActivityLog[]>>('/progress/activity'),
    select: (data) => data.data,
  })
}

// Obtener todas las insignias disponibles
export function useBadgesQuery() {
  return useQuery({
    queryKey: ['badges'],
    queryFn: () => api.get<ApiResponse<Badge[]>>('/progress/badges'),
    select: (data) => data.data,
  })
}
