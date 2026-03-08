import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'

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

  const impersonatingRole = useUiStore((state) => state.impersonatingRole)
  const startImpersonation = useUiStore((state) => state.startImpersonation)
  const stopImpersonation = useUiStore((state) => state.stopImpersonation)

  // Rol efectivo: el impersonado si existe, sino el real
  const effectiveRole = impersonatingRole ?? user?.role
  const isImpersonating = impersonatingRole !== null
  const realRole = user?.role

  const isStudent = effectiveRole === 'estudiante'
  const isTeacher = effectiveRole === 'docente'
  const isAdmin = effectiveRole === 'admin'

  // Roles que el usuario real puede impersonar
  const canImpersonate =
    realRole === 'admin'
      ? (['docente', 'estudiante'] as const)
      : realRole === 'docente'
        ? (['estudiante'] as const)
        : ([] as const)

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    isStudent,
    isTeacher,
    isAdmin,
    isImpersonating,
    realRole,
    effectiveRole,
    canImpersonate,
    startImpersonation,
    stopImpersonation,
    login,
    register,
    logout,
    loadUser,
    fetchMe,
  }
}
