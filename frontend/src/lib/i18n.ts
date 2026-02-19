import es from '@/locales/es'
import en from '@/locales/en'

export type Locale = 'es' | 'en'

const translations: Record<Locale, Record<string, unknown>> = { es, en }

const STORAGE_KEY = 'mimi-locale'
const DEFAULT_LOCALE: Locale = 'es'

let currentLocale: Locale = loadLocale()

function loadLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'es' || stored === 'en') return stored
  } catch {
    // localStorage puede no estar disponible (SSR, privacidad, etc.)
  }
  return DEFAULT_LOCALE
}

function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Silencioso
  }
}

/**
 * Accede a un valor anidado en un objeto usando dot notation.
 * Ej: resolve(obj, 'nav.dashboard') -> obj.nav.dashboard
 */
function resolve(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.')
  let current: unknown = obj

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[key]
  }

  if (typeof current === 'string') return current
  if (typeof current === 'number') return String(current)
  return undefined
}

/**
 * Interpola parametros en un string.
 * Ej: interpolate('Hola, {name}', { name: 'Juan' }) -> 'Hola, Juan'
 */
function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (key in params) return String(params[key])
    return match
  })
}

/**
 * Obtiene una traduccion por clave con dot notation.
 * Si la clave no existe en el idioma actual, hace fallback al español.
 * Si tampoco existe en español, devuelve la clave.
 * Soporta interpolacion: t('dashboard.greeting', { name: 'Juan' })
 */
export function t(key: string, params?: Record<string, string | number>): string {
  // Intentar en el idioma actual
  let value = resolve(translations[currentLocale], key)

  // Fallback al español si no se encuentra
  if (value === undefined && currentLocale !== 'es') {
    value = resolve(translations.es, key)
  }

  // Si no existe en ningun idioma, devolver la clave
  if (value === undefined) return key

  // Interpolar si hay parametros
  if (params) return interpolate(value, params)

  return value
}

/**
 * Cambia el idioma activo y lo guarda en localStorage.
 */
export function setLocale(locale: Locale): void {
  currentLocale = locale
  saveLocale(locale)
}

/**
 * Devuelve el idioma activo.
 */
export function getLocale(): Locale {
  return currentLocale
}
