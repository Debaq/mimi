import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Mail, Lock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'

export default function LoginForm() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  function getFieldError(field: string): string | null {
    if (!touched[field]) return null
    if (field === 'email') {
      if (!email.trim()) return 'El correo es obligatorio'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Correo no valido'
    }
    if (field === 'password') {
      if (!password) return 'La contrasena es obligatoria'
    }
    return null
  }

  const emailError = getFieldError('email')
  const passwordError = getFieldError('password')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setTouched({ email: true, password: true })

    if (!email || !password) {
      setError('Por favor completa todos los campos.')
      return
    }

    if (emailError || passwordError) return

    try {
      await login(email, password)
      const user = useAuthStore.getState().user
      const dest = user?.role === 'admin' ? '/admin' : user?.role === 'docente' ? '/teacher' : '/dashboard'
      navigate(dest)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error al iniciar sesion. Intenta de nuevo.')
      }
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-border/50">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <GraduationCap className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Bienvenido de vuelta</CardTitle>
        <CardDescription>Ingresa tus credenciales para acceder a MIMI</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Correo electronico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                error={!!emailError}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            {emailError && <p className="text-xs text-destructive">{emailError}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contrasena</Label>
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Olvidaste tu contrasena?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                id="password"
                type="password"
                placeholder="Tu contrasena"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                error={!!passwordError}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ingresando...
              </>
            ) : (
              'Iniciar Sesion'
            )}
          </Button>

          <p className="text-sm text-muted text-center">
            No tienes una cuenta?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Registrate aqui
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
