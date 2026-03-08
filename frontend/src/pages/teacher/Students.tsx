import { useState } from 'react'
import {
  Users,
  Search,
  Star,
  Zap,
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { User, ApiResponse } from '@/types'

function useAllStudentsQuery() {
  return useQuery({
    queryKey: ['teacher-students'],
    queryFn: () => api.get<ApiResponse<User[]>>('/teacher/students'),
    select: (data) => data.data,
  })
}

export default function TeacherStudents() {
  const { data: students, isLoading } = useAllStudentsQuery()
  const [search, setSearch] = useState('')

  const filtered = (students ?? []).filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Estudiantes</h1>
        <p className="mt-1 text-muted">
          Lista de todos tus estudiantes y su progreso.
        </p>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Buscar estudiante..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Students list/grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-muted/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            {search ? 'No se encontraron estudiantes' : 'Sin estudiantes aun'}
          </h3>
          <p className="mt-1 text-sm text-muted">
            {search
              ? 'Intenta con otro termino de busqueda.'
              : 'Los estudiantes apareceran aqui cuando se unan a tus sesiones.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((student) => (
            <Card
              key={student.id}
              className="group border-border/50 transition-all hover:shadow-md cursor-pointer"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white text-lg font-bold">
                    {student.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {student.name}
                    </h3>
                    <p className="text-xs text-muted truncate">{student.email}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/30 pt-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted mb-1">
                      <Star className="h-3 w-3 text-warning" />
                      Nivel
                    </div>
                    <p className="text-sm font-bold text-foreground">{student.level}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted mb-1">
                      <Zap className="h-3 w-3 text-primary" />
                      XP
                    </div>
                    <p className="text-sm font-bold text-foreground">{student.xp}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-sm text-muted">
          Mostrando {filtered.length} de {students?.length ?? 0} estudiantes
        </p>
      )}
    </div>
  )
}
