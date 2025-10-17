import { useAuthStore } from '../store/auth.store'

export function useAuth() {
  const { user, token, isAuthenticated, loading, error, login, register, logout, validateToken } = useAuthStore()
  return { user, token, isAuthenticated, loading, error, login, register, logout, validateToken }
}
