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
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const studentLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/sessions', label: 'Sesiones', icon: BookOpen },
  { to: '/profile', label: 'Perfil', icon: User },
  { to: '/resources', label: 'Recursos', icon: FolderOpen },
]

const teacherLinks = [
  { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/teacher/sessions', label: 'Sesiones', icon: BookOpen },
  { to: '/teacher/students', label: 'Estudiantes', icon: Users },
  { to: '/teacher/library', label: 'Biblioteca', icon: Library },
]

export default function Navbar() {
  const { user, isStudent, isTeacher, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const links = isStudent ? studentLinks : isTeacher ? teacherLinks : []

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
    logout()
    navigate('/login')
  }

  const roleLabel = user?.role === 'estudiante' ? 'Estudiante' : 'Docente'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to={isTeacher ? '/teacher' : '/dashboard'} className="flex items-center gap-2">
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
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side: avatar + dropdown */}
        <div className="flex items-center gap-3">
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
                  to={isTeacher ? '/teacher' : '/profile'}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  <User className="h-4 w-4 text-muted" />
                  Mi Perfil
                </Link>
                <div className="my-1 h-px bg-border" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-secondary transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesion
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
                {link.label}
              </Link>
            ))}

            <div className="my-2 h-px bg-border" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-destructive hover:bg-secondary transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Cerrar Sesion
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
