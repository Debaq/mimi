import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ProgressInfo, ApiResponse, ActivityLog, Badge } from '@/types'

interface Level {
  level: number
  min_xp: number
  max_xp: number
  title: string
}

// Respuesta real de la API /progress/me
interface ProgressApiResponse {
  user: { id: number; name: string; level: number; xp: number }
  level_progress: { xp_for_next_level: number | null }
  badges: Badge[]
  available_badges: Badge[]
  stats: Record<string, number>
}

// Obtener mi progreso (nivel, XP, insignias)
export function useProgressQuery() {
  return useQuery({
    queryKey: ['progress'],
    queryFn: () => api.get<ApiResponse<ProgressApiResponse>>('/progress/me'),
    select: (data): ProgressInfo => {
      const d = data.data
      return {
        level: d.user?.level ?? 1,
        xp: d.user?.xp ?? 0,
        next_level_xp: d.level_progress?.xp_for_next_level ?? 100,
        badges: d.badges ?? [],
      }
    },
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

// Respuesta real de la API /progress/activity
interface ActivityApiResponse {
  activities: ActivityLog[]
  total: number
  limit: number
  offset: number
}

// Obtener mi registro de actividad
export function useActivityQuery() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: () => api.get<ApiResponse<ActivityApiResponse>>('/progress/activity'),
    select: (data) => data.data?.activities ?? [],
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
