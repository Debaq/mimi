import { Link } from 'react-router-dom'
import { Users, GraduationCap, BookOpen, Activity, UserPlus, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAdminStatsQuery } from '@/hooks/useAdmin'
import { useTranslation } from '@/hooks/useTranslation'

export default function AdminDashboard() {
  const { data, isLoading } = useAdminStatsQuery()
  const { t } = useTranslation()
  const stats = data?.data

  const cards = [
    {
      label: t('admin.totalUsers'),
      value: stats?.total_users ?? 0,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: t('admin.totalStudents'),
      value: stats?.users_by_role?.estudiante ?? 0,
      icon: GraduationCap,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      label: t('admin.totalTeachers'),
      value: stats?.users_by_role?.docente ?? 0,
      icon: BookOpen,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
    {
      label: t('admin.activeSessions'),
      value: stats?.active_sessions ?? 0,
      icon: Activity,
      color: 'text-violet-600',
      bg: 'bg-violet-500/10',
    },
  ]

  const roleBadgeVariant = (role: string) => {
    if (role === 'admin') return 'destructive' as const
    if (role === 'docente') return 'default' as const
    return 'secondary' as const
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('admin.title')}</h1>
        <p className="text-muted mt-1">{t('admin.subtitle')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                {isLoading ? (
                  <div className="h-7 w-16 animate-pulse rounded bg-secondary" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                )}
                <p className="text-sm text-muted">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base">{t('admin.recentUsers')}</CardTitle>
            <Link to="/admin/users" className="text-sm text-primary hover:underline flex items-center gap-1">
              {t('admin.viewAll')} <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-secondary" />
                ))}
              </div>
            ) : stats?.recent_users?.length ? (
              <div className="space-y-2">
                {stats.recent_users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {(u.name ?? 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted">{u.email}</p>
                      </div>
                    </div>
                    <Badge variant={roleBadgeVariant(u.role)}>{u.role}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted py-4 text-center">{t('admin.noUsers')}</p>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/users?action=create">
              <Button className="w-full justify-start gap-3" variant="outline">
                <UserPlus className="h-4 w-4" />
                {t('admin.createUser')}
              </Button>
            </Link>
            <Link to="/admin/users">
              <Button className="w-full justify-start gap-3 mt-2" variant="outline">
                <Users className="h-4 w-4" />
                {t('admin.viewUsers')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
