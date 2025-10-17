import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types/auth'
import type { LoginRequest, RegisterRequest } from '../types/auth'
import * as AuthAPI from '../api/auth.service'
import { setAuthToken } from '../api/http'
import { TOKEN_KEY } from '../configs/constants'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error?: string
  login: (payload: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => void
  validateToken: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      async login(payload) {
        set({ loading: true, error: undefined })
        try {
          const res = await AuthAPI.login(payload)
          set({ user: res.user, token: res.token, isAuthenticated: true })
          setAuthToken(res.token)
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Error de login'
          set({ error: message })
          throw e
        } finally {
          set({ loading: false })
        }
      },
      async register(payload) {
        set({ loading: true, error: undefined })
        try {
          const res = await AuthAPI.register(payload)
          set({ user: res.user, token: res.token, isAuthenticated: true })
          setAuthToken(res.token)
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Error de registro'
          set({ error: message })
          throw e
        } finally {
          set({ loading: false })
        }
      },
      logout() {
  set({ user: null, token: null, isAuthenticated: false })
  setAuthToken(null)
      },
      async validateToken() {
        const token = get().token
        if (!token) {
          set({ isAuthenticated: false, user: null })
          return
        }
        try {
          const profile = await AuthAPI.me()
          set({ user: profile, isAuthenticated: true })
        } catch {
          set({ isAuthenticated: false, user: null, token: null })
        }
      }
    }),
    {
      name: TOKEN_KEY,
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        // Establecer el token en el cliente HTTP tras rehidratar
        setAuthToken(state?.token ?? null)
      },
    }
  )
)
