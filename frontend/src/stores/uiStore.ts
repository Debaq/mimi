import { create } from 'zustand'

type Theme = 'light'

interface UiState {
  sidebarOpen: boolean
  theme: Theme
  activeModal: string | null

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: Theme) => void
  openModal: (modalId: string) => void
  closeModal: () => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  activeModal: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  setTheme: (theme: Theme) => set({ theme }),

  openModal: (modalId: string) => set({ activeModal: modalId }),

  closeModal: () => set({ activeModal: null }),
}))
