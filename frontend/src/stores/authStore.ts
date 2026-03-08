import { create } from 'zustand'
import type { User } from '@/types'
import { api } from '@/lib/api'
import {
  getToken,
  setToken,
  removeToken,
  isTokenExpired,
  decodeToken,
} from '@/lib/auth'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (email: string, password: string) => Promise<void>
  register: (
    name: string,
    email: string,
    password: string,
    role: 'estudiante' | 'docente'
  ) => Promise<void>
  logout: () => void
  loadUser: () => void
  fetchMe: () => Promise<void>
}

interface AuthResponse {
  success: boolean
  data: {
    token: string
    user: User
  }
}

interface MeResponse {
  success: boolean
  data: User
}

export const useAuthStore = create<AuthState>((set) => {
  // Inicializar desde localStorage
  const storedToken = getToken()
  let initialUser: User | null = null
  let initialAuthenticated = false

  if (storedToken && !isTokenExpired(storedToken)) {
    const decoded = decodeToken(storedToken)
    if (decoded) {
      initialUser = {
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        level: 0,
        xp: 0,
        avatar_url: null,
        created_at: '',
      }
      initialAuthenticated = true
    }
  } else if (storedToken) {
    // Token expirado, eliminarlo
    removeToken()
  }

  return {
    user: initialUser,
    token: initialAuthenticated ? storedToken : null,
    isAuthenticated: initialAuthenticated,
    isLoading: false,

    login: async (email: string, password: string) => {
      set({ isLoading: true })
      try {
        const response = await api.post<AuthResponse>('/auth/login', {
          email,
          password,
        })
        setToken(response.data.token)
        set({
          user: response.data.user,
          token: response.data.token,
          isAuthenticated: true,
          isLoading: false,
        })
      } catch (error) {
        set({ isLoading: false })
        throw error
      }
    },

    register: async (
      name: string,
      email: string,
      password: string,
      role: 'estudiante' | 'docente'
    ) => {
      set({ isLoading: true })
      try {
        const response = await api.post<AuthResponse>('/auth/register', {
          name,
          email,
          password,
          role,
        })
        setToken(response.data.token)
        set({
          user: response.data.user,
          token: response.data.token,
          isAuthenticated: true,
          isLoading: false,
        })
      } catch (error) {
        set({ isLoading: false })
        throw error
      }
    },

    logout: () => {
      removeToken()
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      })
    },

    loadUser: () => {
      const token = getToken()
      if (!token || isTokenExpired(token)) {
        removeToken()
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        return
      }

      const decoded = decodeToken(token)
      if (decoded) {
        set({
          user: {
            id: decoded.sub,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role,
            level: 0,
            xp: 0,
            avatar_url: null,
            created_at: '',
          },
          token,
          isAuthenticated: true,
        })
      }
    },

    fetchMe: async () => {
      set({ isLoading: true })
      try {
        const response = await api.get<MeResponse>('/auth/me')
        set({ user: response.data, isLoading: false })
      } catch {
        removeToken()
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    },
  }
})
