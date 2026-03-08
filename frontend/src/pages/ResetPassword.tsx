import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { GraduationCap, Lock, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { useTranslation } from '@/hooks/useTranslation'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'

export default function ResetPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!password) {
      setError(t('auth.passwordRequired'))
      return
    }
    if (password.length < 6) {
      setError(t('auth.passwordMinLength'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordsMismatch'))
      return
    }
    if (!token) {
      setError(t('auth.invalidToken'))
      return
    }

    setIsLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      toast('success', t('auth.resetSuccess'))
      navigate('/login')
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(t('errors.serverError'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground tracking-tight">MIMI</span>
          </Link>

          <Card className="w-full max-w-md shadow-lg border-border/50">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold">{t('auth.invalidToken')}</CardTitle>
              <CardDescription>{t('auth.tokenExpired')}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center pt-2">
              <Link to="/forgot-password" className="text-sm text-primary font-medium hover:underline">
                {t('auth.sendResetLink')}
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground tracking-tight">MIMI</span>
        </Link>

        <Card className="w-full max-w-md shadow-lg border-border/50">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">{t('auth.resetPasswordTitle')}</CardTitle>
            <CardDescription>{t('auth.resetPasswordDesc')}</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.newPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('auth.minCharsPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t('auth.repeatPassword')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('auth.resetPassword')
                )}
              </Button>

              <Link
                to="/login"
                className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('auth.backToLogin')}
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
