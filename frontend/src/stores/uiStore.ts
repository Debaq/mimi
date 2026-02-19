import { create } from 'zustand'
import { getLocale, setLocale as setI18nLocale } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'

type Theme = 'light' | 'dark' | 'system'

function applyThemeToDOM(theme: Theme) {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  document.documentElement.classList.toggle('dark', isDark)
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('mimi-theme')
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }
  return 'system'
}

const initialTheme = getInitialTheme()
applyThemeToDOM(initialTheme)

interface UiState {
  sidebarOpen: boolean
  theme: Theme
  locale: Locale
  activeModal: string | null

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: Theme) => void
  setLocale: (locale: Locale) => void
  openModal: (modalId: string) => void
  closeModal: () => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  theme: initialTheme,
  locale: getLocale(),
  activeModal: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  setTheme: (theme: Theme) => {
    localStorage.setItem('mimi-theme', theme)
    applyThemeToDOM(theme)
    set({ theme })
  },

  setLocale: (locale: Locale) => {
    setI18nLocale(locale)
    set({ locale })
  },

  openModal: (modalId: string) => set({ activeModal: modalId }),

  closeModal: () => set({ activeModal: null }),
}))
