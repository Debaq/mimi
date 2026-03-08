import { Settings } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

export default function AdminSettings() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('nav.settings')}</h1>
        <p className="text-muted mt-1">{t('admin.settingsDesc')}</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-16 text-center">
        <Settings className="h-12 w-12 text-muted mb-4" />
        <h2 className="text-lg font-semibold text-foreground">{t('admin.settingsPlaceholder')}</h2>
        <p className="text-sm text-muted mt-2 max-w-md">
          {t('admin.settingsPlaceholderDesc')}
        </p>
      </div>
    </div>
  )
}
