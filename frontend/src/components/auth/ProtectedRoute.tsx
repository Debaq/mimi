import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'estudiante' | 'docente' | 'admin'
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, effectiveRole, realRole } = useAuth()

  // Mostrar skeleton mientras se verifica la autenticacion
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md px-4">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-secondary mx-auto" />
          <div className="h-4 w-64 animate-pulse rounded-lg bg-secondary mx-auto" />
          <div className="space-y-3 mt-8">
            <div className="h-12 animate-pulse rounded-xl bg-secondary" />
            <div className="h-12 animate-pulse rounded-xl bg-secondary" />
            <div className="h-12 animate-pulse rounded-xl bg-secondary" />
          </div>
        </div>
      </div>
    )
  }

  // Redirigir a login si no esta autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Verificar rol: usar el rol efectivo (impersonado o real)
  if (requiredRole && effectiveRole !== requiredRole) {
    if (realRole === 'admin' && !effectiveRole) {
      return <Navigate to="/admin" replace />
    }
    if (effectiveRole === 'admin') {
      return <Navigate to="/admin" replace />
    }
    if (effectiveRole === 'docente') {
      return <Navigate to="/teacher" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
