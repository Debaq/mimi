import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  LayoutDashboard,
  BookOpen,
  Users,
  FolderOpen,
  Library,
  Settings,
  Eye,
  ArrowLeft,
  Moon,
  Sun,
  Globe,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUiStore } from '@/stores/uiStore'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import type { Locale } from '@/lib/i18n'

type NavLink = { to: string; labelKey: string; icon: React.ComponentType<{ className?: string }> }

const studentLinks: NavLink[] = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/sessions', labelKey: 'nav.sessions', icon: BookOpen },
  { to: '/profile', labelKey: 'nav.profile', icon: User },
  { to: '/resources', labelKey: 'nav.resources', icon: FolderOpen },
]

const teacherLinks: NavLink[] = [
  { to: '/teacher', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/teacher/sessions', labelKey: 'nav.sessions', icon: BookOpen },
  { to: '/teacher/students', labelKey: 'nav.students', icon: Users },
  { to: '/teacher/library', labelKey: 'nav.library', icon: Library },
]

const adminLinks: NavLink[] = [
  { to: '/admin', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/admin/users', labelKey: 'nav.users', icon: Users },
  { to: '/admin/settings', labelKey: 'nav.settings', icon: Settings },
]

export default function Navbar() {
  const { user, isStudent, isTeacher, isAdmin, isImpersonating, realRole, canImpersonate, startImpersonation, stopImpersonation, logout } = useAuth()
  const navigate = useNavigate()
  const { theme, setTheme, locale, setLocale } = useUiStore()
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  function toggleTheme() {
    setTheme(isDark ? 'light' : 'dark')
  }

  function toggleLocale() {
    const next: Locale = locale === 'es' ? 'en' : 'es'
    setLocale(next)
  }

  const links = isAdmin ? adminLinks : isStudent ? studentLinks : isTeacher ? teacherLinks : []

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    stopImpersonation()
    logout()
    navigate('/login')
  }

  function handleImpersonate(role: 'estudiante' | 'docente') {
    startImpersonation(role)
    setDropdownOpen(false)
    setMobileOpen(false)
    navigate(role === 'docente' ? '/teacher' : '/dashboard')
  }

  function handleStopImpersonation() {
    stopImpersonation()
    navigate(realRole === 'admin' ? '/admin' : '/teacher')
  }

  const roleLabels: Record<string, string> = {
    admin: t('auth.admin'),
    docente: t('auth.teacher'),
    estudiante: t('auth.student'),
  }
  const roleLabel = isImpersonating
    ? `${roleLabels[realRole ?? '']} → ${roleLabels[isAdmin ? 'admin' : isTeacher ? 'docente' : 'estudiante']}`
    : roleLabels[user?.role ?? ''] ?? ''

  return (
    <>
    {/* Banner de impersonacion */}
    {isImpersonating && (
      <div className="sticky top-0 z-[60] flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-white">
        <Eye className="h-4 w-4" />
        <span>{t('nav.viewingAs', { role: roleLabels[isAdmin ? 'admin' : isTeacher ? 'docente' : 'estudiante'] })}</span>
        <button
          onClick={handleStopImpersonation}
          className="ml-2 flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold transition-colors hover:bg-white/30"
        >
          <ArrowLeft className="h-3 w-3" />
          {t('nav.exitView')}
        </button>
      </div>
    )}
    <header className={cn("sticky z-50 w-full border-b border-border bg-card/80 backdrop-blur-xl", isImpersonating ? 'top-[40px]' : 'top-0')}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to={isAdmin ? '/admin' : isTeacher ? '/teacher' : '/dashboard'} className="flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-foreground tracking-tight">MIMI</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-secondary hover:text-foreground"
            >
              <link.icon className="h-4 w-4" />
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        {/* Right side: locale toggle + theme toggle + avatar + dropdown */}
        <div className="flex items-center gap-3">
          {/* Locale toggle */}
          <button
            onClick={toggleLocale}
            className="flex h-9 items-center justify-center gap-1 rounded-xl px-2 text-sm font-medium text-muted transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={t('nav.language')}
            title={t('nav.language')}
          >
            <Globe className="h-4 w-4" />
            <span className="uppercase">{locale}</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={isDark ? t('nav.lightMode') : t('nav.darkMode')}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* User dropdown (desktop) */}
          <div className="relative hidden md:block" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium leading-tight">{user?.name}</p>
                <p className="text-xs text-muted">{roleLabel}</p>
              </div>
              <ChevronDown className={cn('h-4 w-4 text-muted transition-transform', dropdownOpen && 'rotate-180')} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-1 shadow-lg">
                <Link
                  to={isAdmin ? '/admin' : isTeacher ? '/teacher' : '/profile'}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  <User className="h-4 w-4 text-muted" />
                  {t('nav.myProfile')}
                </Link>
                {canImpersonate.length > 0 && (
                  <>
                    <div className="my-1 h-px bg-border" />
                    <p className="px-3 py-1.5 text-xs font-medium text-muted">{t('nav.viewAs')}</p>
                    {canImpersonate.map((role) => (
                      <button
                        key={role}
                        onClick={() => handleImpersonate(role)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                      >
                        <Eye className="h-4 w-4 text-muted" />
                        {roleLabels[role]}
                      </button>
                    ))}
                  </>
                )}
                <div className="my-1 h-px bg-border" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-secondary transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {t('nav.logout')}
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground hover:bg-secondary md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-card px-4 py-4 md:hidden">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-secondary p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted">{roleLabel}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <link.icon className="h-5 w-5 text-muted" />
                {t(link.labelKey)}
              </Link>
            ))}

            {/* Mobile locale toggle */}
            <button
              onClick={toggleLocale}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <Globe className="h-5 w-5 text-muted" />
              {t('nav.language')}: <span className="uppercase font-semibold">{locale}</span>
            </button>

            {/* Mobile view-as */}
            {canImpersonate.length > 0 && (
              <>
                <div className="my-2 h-px bg-border" />
                <p className="px-3 py-1.5 text-xs font-medium text-muted">{t('nav.viewAs')}</p>
                {canImpersonate.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleImpersonate(role)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <Eye className="h-5 w-5 text-muted" />
                    {roleLabels[role]}
                  </button>
                ))}
              </>
            )}

            <div className="my-2 h-px bg-border" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-destructive hover:bg-secondary transition-colors"
            >
              <LogOut className="h-5 w-5" />
              {t('nav.logout')}
            </button>
          </nav>
        </div>
      )}
    </header>
    </>
  )
}
