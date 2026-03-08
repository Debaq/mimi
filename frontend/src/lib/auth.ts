import type { User } from '@/types'

const TOKEN_KEY = 'mimi_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

interface JwtPayload {
  sub: number
  name: string
  email: string
  role: 'estudiante' | 'docente' | 'admin'
  exp: number
  iat: number
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payload = parts[1]
    // Reemplazar caracteres de base64url a base64 estandar
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )

    return JSON.parse(jsonPayload) as JwtPayload
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded) {
    return true
  }

  // exp esta en segundos, Date.now() en milisegundos
  const now = Date.now() / 1000
  return decoded.exp < now
}

export function getUser(): Partial<User> | null {
  const token = getToken()
  if (!token) {
    return null
  }

  if (isTokenExpired(token)) {
    removeToken()
    return null
  }

  const decoded = decodeToken(token)
  if (!decoded) {
    return null
  }

  return {
    id: decoded.sub,
    name: decoded.name,
    email: decoded.email,
    role: decoded.role,
  }
}
