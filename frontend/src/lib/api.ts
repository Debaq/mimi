import { getToken } from './auth'

// En desarrollo usa el proxy de Vite (/api -> localhost:8080)
// En produccion usa la variable de entorno o ruta relativa al backend
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let message = `Error ${response.status}`
    try {
      const errorData = await response.json()
      message = errorData.message || errorData.error || message
    } catch {
      // Si no se puede parsear el JSON, usar el mensaje por defecto
    }
    throw new ApiError(message, response.status)
  }

  // Para respuestas 204 No Content
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export const api = {
  get<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'GET' })
  },

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE' })
  },
}

export { ApiError }
