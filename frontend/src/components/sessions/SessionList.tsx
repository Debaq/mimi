import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import SessionCard from './SessionCard'
import { Search, FolderOpen } from 'lucide-react'
import type { Session } from '@/types'

interface SessionListProps {
  sessions: Session[]
  role: 'estudiante' | 'docente'
  loading?: boolean
  onSessionClick?: (session: Session) => void
}

export default function SessionList({
  sessions,
  role,
  loading = false,
  onSessionClick,
}: SessionListProps) {
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filtered = useMemo(() => {
    return sessions.filter((session) => {
      const matchesSearch =
        !search ||
        session.title.toLowerCase().includes(search.toLowerCase()) ||
        session.description.toLowerCase().includes(search.toLowerCase())
      const matchesMode = filterMode === 'all' || session.mode === filterMode
      const matchesStatus = filterStatus === 'all' || session.status === filterStatus
      return matchesSearch && matchesMode && matchesStatus
    })
  }, [sessions, search, filterMode, filterStatus])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Barra de busqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar sesiones..."
            className="pl-10"
          />
        </div>
        <Select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
          className="w-full sm:w-40"
        >
          <SelectOption value="all">Todos los modos</SelectOption>
          <SelectOption value="constructor">Constructor</SelectOption>
          <SelectOption value="detective">Detective</SelectOption>
          <SelectOption value="laboratorio">Laboratorio</SelectOption>
        </Select>
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full sm:w-40"
        >
          <SelectOption value="all">Todos los estados</SelectOption>
          <SelectOption value="activa">Activa</SelectOption>
          <SelectOption value="borrador">Borrador</SelectOption>
          <SelectOption value="cerrada">Cerrada</SelectOption>
        </Select>
      </div>

      {/* Grid de sesiones */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <FolderOpen className="size-12 text-muted" />
          <div className="text-center">
            <p className="font-medium text-foreground">No se encontraron sesiones</p>
            <p className="text-sm text-muted mt-1">
              {search || filterMode !== 'all' || filterStatus !== 'all'
                ? 'Intenta ajustar los filtros de busqueda.'
                : 'Aun no hay sesiones disponibles.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              role={role}
              onClick={() => onSessionClick?.(session)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
