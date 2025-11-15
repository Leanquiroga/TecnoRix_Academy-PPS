import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PaletteMode } from '@mui/material'

interface ThemeState {
  mode: PaletteMode
  toggleMode: () => void
  setMode: (m: PaletteMode) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      toggleMode: () => {
        const next: PaletteMode = get().mode === 'light' ? 'dark' : 'light'
        set({ mode: next })
      },
      setMode: (m) => set({ mode: m }),
    }),
    {
      name: 'app-theme-mode',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
)

// Inicialización opcional según prefers-color-scheme si no hay persistido
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('app-theme-mode')
    if (!stored) {
      const prefersDark = typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false
      useThemeStore.getState().setMode(prefersDark ? 'dark' : 'light')
    }
  } catch {
    // Silenciar errores de acceso a localStorage/matchMedia en entornos de test
  }
}
