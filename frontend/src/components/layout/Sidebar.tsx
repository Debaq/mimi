import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  User,
  FolderOpen,
  Users,
  Library,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useUiStore } from '@/stores/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const studentItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/sessions', label: 'Sesiones', icon: BookOpen },
  { to: '/profile', label: 'Perfil', icon: User },
  { to: '/resources', label: 'Recursos', icon: FolderOpen },
]

const teacherItems: NavItem[] = [
  { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/teacher/sessions', label: 'Sesiones', icon: BookOpen },
  { to: '/teacher/students', label: 'Estudiantes', icon: Users },
  { to: '/teacher/library', label: 'Biblioteca', icon: Library },
]

export default function Sidebar() {
  const location = useLocation()
  const { isTeacher } = useAuth()
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  const items = isTeacher ? teacherItems : studentItems

  function isActive(to: string) {
    if (to === '/teacher' || to === '/dashboard') {
      return location.pathname === to
    }
    return location.pathname.startsWith(to)
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out',
        sidebarOpen ? 'w-60' : 'w-[68px]'
      )}
    >
      {/* Nav items */}
      <nav className="flex-1 space-y-1 p-3 pt-4">
        {items.map((item) => {
          const active = isActive(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:bg-secondary hover:text-foreground',
                !sidebarOpen && 'justify-center px-0'
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              <item.icon className={cn('h-5 w-5 shrink-0', active && 'text-primary')} />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-3">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-secondary hover:text-foreground"
          title={sidebarOpen ? 'Colapsar' : 'Expandir'}
        >
          {sidebarOpen ? (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Colapsar</span>
            </>
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  )
}
