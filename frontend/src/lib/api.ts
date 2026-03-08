import { getToken } from './auth'

// En desarrollo usa el proxy de Vite (/api -> localhost:8080)
// En produccion auto-detecta: {VITE_BASE}backend/api
// Se puede sobreescribir con VITE_API_URL si el backend esta en otro lugar
function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  if (import.meta.env.DEV) return '/api'
  return import.meta.env.BASE_URL + 'backend/api'
}
const BASE_URL = getApiBaseUrl()

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
  get<T>(endpoint: string, params?: Record<string, string | undefined>): Promise<T> {
    let url = endpoint
    if (params) {
      const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as [string, string][]
      if (entries.length > 0) {
        url += '?' + new URLSearchParams(entries).toString()
      }
    }
    return request<T>(url, { method: 'GET' })
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

  async upload<T>(endpoint: string, file: File, fieldName = 'avatar'): Promise<T> {
    const token = getToken()
    const formData = new FormData()
    formData.append(fieldName, file)

    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      let message = `Error ${response.status}`
      try {
        const errorData = await response.json()
        message = errorData.message || errorData.error || message
      } catch {
        // fallback
      }
      throw new ApiError(message, response.status)
    }

    return response.json()
  },
}

export { ApiError }
