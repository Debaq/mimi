import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)
  const logout = useAuthStore((state) => state.logout)
  const loadUser = useAuthStore((state) => state.loadUser)
  const fetchMe = useAuthStore((state) => state.fetchMe)

  const isStudent = user?.role === 'estudiante'
  const isTeacher = user?.role === 'docente'

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    isStudent,
    isTeacher,
    login,
    register,
    logout,
    loadUser,
    fetchMe,
  }
}
