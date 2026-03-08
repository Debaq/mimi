import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { UserPlus, Pencil, Trash2, Search, Loader2, Copy, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Badge } from '@/components/ui/Badge'
import { Select, SelectOption } from '@/components/ui/Select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import { toast } from '@/components/ui/Toast'
import {
  useAdminUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '@/hooks/useAdmin'
import { useTranslation } from '@/hooks/useTranslation'
import type { User } from '@/types'

export default function AdminUsers() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Dialogs
  const [createOpen, setCreateOpen] = useState(searchParams.get('action') === 'create')
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Form
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRole, setFormRole] = useState<'estudiante' | 'docente' | 'admin'>('estudiante')
  const [formPassword, setFormPassword] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useAdminUsersQuery({
    page,
    limit: 10,
    role: roleFilter,
    search: debouncedSearch,
  })

  const createMutation = useCreateUserMutation()
  const updateMutation = useUpdateUserMutation()
  const deleteMutation = useDeleteUserMutation()

  const users = data?.data?.users ?? []
  const pagination = data?.data?.pagination

  function resetForm() {
    setFormName('')
    setFormEmail('')
    setFormRole('estudiante')
    setFormPassword('')
  }

  function openCreate() {
    resetForm()
    setTempPassword(null)
    setCreateOpen(true)
  }

  function openEdit(user: User) {
    setSelectedUser(user)
    setFormName(user.name)
    setFormEmail(user.email)
    setFormRole(user.role)
    setFormPassword('')
    setEditOpen(true)
  }

  function openDelete(user: User) {
    setSelectedUser(user)
    setDeleteOpen(true)
  }

  async function handleCreate() {
    try {
      const res = await createMutation.mutateAsync({
        name: formName,
        email: formEmail,
        role: formRole,
        password: formPassword || undefined,
      })
      if (res.data.temp_password) {
        setTempPassword(res.data.temp_password)
      } else {
        setCreateOpen(false)
        toast('success', t('admin.userCreated'))
      }
    } catch (err) {
      toast('error', err instanceof Error ? err.message : t('admin.errorCreating'))
    }
  }

  async function handleUpdate() {
    if (!selectedUser) return
    try {
      const data: Record<string, string> = {}
      if (formName !== selectedUser.name) data.name = formName
      if (formEmail !== selectedUser.email) data.email = formEmail
      if (formRole !== selectedUser.role) data.role = formRole
      if (formPassword) data.password = formPassword

      if (Object.keys(data).length === 0) {
        setEditOpen(false)
        return
      }

      await updateMutation.mutateAsync({ id: selectedUser.id, ...data })
      setEditOpen(false)
      toast('success', t('admin.userUpdated'))
    } catch (err) {
      toast('error', err instanceof Error ? err.message : t('admin.errorUpdating'))
    }
  }

  async function handleDelete() {
    if (!selectedUser) return
    try {
      await deleteMutation.mutateAsync(selectedUser.id)
      setDeleteOpen(false)
      toast('success', t('admin.userDeleted'))
    } catch (err) {
      toast('error', err instanceof Error ? err.message : t('admin.errorDeleting'))
    }
  }

  function copyTempPassword() {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const roleBadgeVariant = (role: string) => {
    if (role === 'admin') return 'destructive' as const
    if (role === 'docente') return 'default' as const
    return 'secondary' as const
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('admin.usersTitle')}</h1>
          <p className="text-muted mt-1">{t('admin.usersSubtitle')}</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <UserPlus className="h-4 w-4" />
          {t('admin.createUser')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder={t('admin.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          className="sm:w-48"
        >
          <SelectOption value="">{t('admin.allRoles')}</SelectOption>
          <SelectOption value="estudiante">{t('auth.student')}</SelectOption>
          <SelectOption value="docente">{t('auth.teacher')}</SelectOption>
          <SelectOption value="admin">{t('auth.admin')}</SelectOption>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-muted">{t('admin.colName')}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">{t('admin.colEmail')}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">{t('admin.colRole')}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">{t('admin.colDate')}</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">{t('admin.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="px-4 py-3"><div className="h-4 w-32 animate-pulse rounded bg-secondary" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-40 animate-pulse rounded bg-secondary" /></td>
                      <td className="px-4 py-3"><div className="h-5 w-20 animate-pulse rounded-full bg-secondary" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-24 animate-pulse rounded bg-secondary" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-16 animate-pulse rounded bg-secondary ml-auto" /></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted">
                      {t('admin.noUsers')}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            {(u.name ?? 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={roleBadgeVariant(u.role)}>{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(u)}
                            className="rounded-lg p-2 text-muted hover:bg-secondary hover:text-foreground transition-colors"
                            title={t('common.edit')}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDelete(u)}
                            className="rounded-lg p-2 text-muted hover:bg-destructive/10 hover:text-destructive transition-colors"
                            title={t('common.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-sm text-muted">
                {t('admin.showing')} {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} {t('admin.of')}{' '}
                {pagination.total}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setTempPassword(null); resetForm() } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tempPassword ? t('admin.userCreatedTitle') : t('admin.createUser')}</DialogTitle>
            <DialogDescription>
              {tempPassword ? t('admin.tempPasswordDesc') : t('admin.createUserDesc')}
            </DialogDescription>
          </DialogHeader>

          {tempPassword ? (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
                <code className="flex-1 text-sm font-mono text-foreground">{tempPassword}</code>
                <button
                  onClick={copyTempPassword}
                  className="rounded-lg p-2 hover:bg-secondary transition-colors"
                  title="Copiar"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-muted" />}
                </button>
              </div>
              <DialogFooter>
                <Button onClick={() => { setCreateOpen(false); setTempPassword(null); resetForm() }}>
                  {t('common.close')}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleCreate() }} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{t('auth.name')}</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t('admin.namePlaceholder')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.email')}</Label>
                <Input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.role')}</Label>
                <Select value={formRole} onChange={(e) => setFormRole(e.target.value as typeof formRole)}>
                  <SelectOption value="estudiante">{t('auth.student')}</SelectOption>
                  <SelectOption value="docente">{t('auth.teacher')}</SelectOption>
                  <SelectOption value="admin">{t('auth.admin')}</SelectOption>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('auth.password')} <span className="text-muted font-normal">({t('admin.optional')})</span></Label>
                <Input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={t('admin.passwordPlaceholder')}
                  minLength={6}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {t('common.loading')}</>
                  ) : (
                    t('common.create')
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.editUser')}</DialogTitle>
            <DialogDescription>{t('admin.editUserDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleUpdate() }} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t('auth.name')}</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('auth.email')}</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('auth.role')}</Label>
              <Select value={formRole} onChange={(e) => setFormRole(e.target.value as typeof formRole)}>
                <SelectOption value="estudiante">{t('auth.student')}</SelectOption>
                <SelectOption value="docente">{t('auth.teacher')}</SelectOption>
                <SelectOption value="admin">{t('auth.admin')}</SelectOption>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.newPassword')} <span className="text-muted font-normal">({t('admin.optional')})</span></Label>
              <Input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder={t('admin.leaveBlank')}
                minLength={6}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> {t('common.loading')}</>
                ) : (
                  t('common.save')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.deleteUser')}</DialogTitle>
            <DialogDescription>
              {t('admin.deleteConfirm', { name: selectedUser?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t('common.loading')}</>
              ) : (
                t('common.delete')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
