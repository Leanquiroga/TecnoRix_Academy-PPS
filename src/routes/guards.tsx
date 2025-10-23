import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import type { Role } from '../types/auth'
import type { ReactNode } from 'react'
import { ROUTES } from './routes.config'

export function PrivateRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />
  return <>{children}</>
}

export function RoleRoute({ children, roles }: { children: ReactNode; roles: Role[] }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  if (!isAuthenticated || !user) return <Navigate to={ROUTES.LOGIN} replace />
  if (!roles.includes(user.role)) return <Navigate to={ROUTES.HOME} replace />
  return <>{children}</>
}
