import { useCallback } from 'react'
import { t as translate } from '@/lib/i18n'
import { useUiStore } from '@/stores/uiStore'
import type { Locale } from '@/lib/i18n'

/**
 * Hook de traduccion para componentes React.
 * Se suscribe a cambios de locale en uiStore para forzar re-renders.
 *
 * Uso:
 *   const { t, locale } = useTranslation()
 *   t('nav.dashboard')         -> 'Dashboard'
 *   t('dashboard.greeting', { name: 'Juan' }) -> 'Hola, Juan'
 */
export function useTranslation() {
  // Suscribirse al locale del store para que el componente
  // se re-renderice cuando cambie el idioma
  const locale: Locale = useUiStore((state) => state.locale)

  // Wrapeamos la funcion t para que React detecte la dependencia de locale
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      return translate(key, params)
    },
    // locale como dependencia fuerza la recreacion de t cuando cambia el idioma
    [locale]
  )

  return { t, locale } as const
}
