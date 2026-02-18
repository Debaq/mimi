import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Mail, Lock, UserIcon, Loader2, BookOpen, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export default function RegisterForm() {
  const navigate = useNavigate()
  const { register, isLoading } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'estudiante' | 'docente'>('estudiante')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  function touch(field: string) {
    setTouched((p) => ({ ...p, [field]: true }))
  }

  function getFieldError(field: string): string | null {
    if (!touched[field]) return null
    switch (field) {
      case 'name':
        if (!name.trim()) return 'El nombre es obligatorio'
        if (name.trim().length < 3) return 'Minimo 3 caracteres'
        return null
      case 'email':
        if (!email.trim()) return 'El correo es obligatorio'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Correo no valido'
        return null
      case 'password':
        if (!password) return 'La contrasena es obligatoria'
        if (password.length < 6) return 'Minimo 6 caracteres'
        return null
      case 'confirmPassword':
        if (!confirmPassword) return 'Confirma tu contrasena'
        if (password !== confirmPassword) return 'Las contrasenas no coinciden'
        return null
      default:
        return null
    }
  }

  const nameError = getFieldError('name')
  const emailError = getFieldError('email')
  const passwordError = getFieldError('password')
  const confirmError = getFieldError('confirmPassword')
  const hasFieldErrors = !!(nameError || emailError || passwordError || confirmError)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setTouched({ name: true, email: true, password: true, confirmPassword: true })

    if (!name || !email || !password || !confirmPassword) {
      setError('Por favor completa todos los campos.')
      return
    }

    if (hasFieldErrors) return

    try {
      await register(name, email, password, role)
      navigate(role === 'docente' ? '/teacher' : '/dashboard')
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error al registrar. Intenta de nuevo.')
      }
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-border/50">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <GraduationCap className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Crear cuenta</CardTitle>
        <CardDescription>Unete a MIMI y comienza tu camino en investigacion</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Role selector */}
          <div className="space-y-2">
            <Label>Soy...</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('estudiante')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all duration-200',
                  role === 'estudiante'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted hover:border-primary/30 hover:text-foreground'
                )}
              >
                <BookOpen className="h-6 w-6" />
                Estudiante
              </button>
              <button
                type="button"
                onClick={() => setRole('docente')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all duration-200',
                  role === 'docente'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted hover:border-primary/30 hover:text-foreground'
                )}
              >
                <Users className="h-6 w-6" />
                Docente
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => touch('name')}
                error={!!nameError}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>

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
                onBlur={() => touch('email')}
                error={!!emailError}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            {emailError && <p className="text-xs text-destructive">{emailError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contrasena</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                id="password"
                type="password"
                placeholder="Minimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => touch('password')}
                error={!!passwordError}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repite tu contrasena"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => touch('confirmPassword')}
                error={!!confirmError}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            {confirmError && <p className="text-xs text-destructive">{confirmError}</p>}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </Button>

          <p className="text-sm text-muted text-center">
            Ya tienes una cuenta?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Inicia sesion
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
