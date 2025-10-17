import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import type { Role } from '../types/auth'
import type { ReactNode } from 'react'

export function PrivateRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function RoleRoute({ children, roles }: { children: ReactNode; roles: Role[] }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}
