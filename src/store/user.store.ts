import { create } from 'zustand'
import type { User, Role, UserStatus } from '../types/auth'
import type { TeacherApplication, ReviewCredentialData } from '../api/teacher.service'
import * as UserAPI from '../api/user.service'
import * as TeacherAPI from '../api/teacher.service'

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface UserState {
  // Estado usuarios
  users: User[]
  usersPagination: Pagination
  // Estado aplicaciones profesores
  applications: TeacherApplication[]
  applicationsStatusFilter: string // 'pending_validation' | 'active' | 'rejected' | 'suspended' | 'all'
  applicationsPagination: Pagination // Placeholder para futura paginación (API actual devuelve total sin páginas)
  // Flags
  loading: boolean
  error: string | null
  success: string | null

  // Acciones usuarios
  fetchUsers: (page?: number, limit?: number, search?: string, role?: Role, status?: UserStatus) => Promise<void>
  approveTeacher: (userId: string) => Promise<void>
  changeUserRole: (userId: string, role: Role) => Promise<void>
  suspendUser: (userId: string, suspend: boolean) => Promise<void>

  // Acciones aplicaciones profesores
  setApplicationsStatusFilter: (status: string) => void
  fetchTeacherApplications: (statusOverride?: string) => Promise<void>
  approveTeacherApplication: (userId: string) => Promise<void>
  rejectTeacherApplication: (userId: string, reason: string) => Promise<void>
  reviewCredential: (credentialId: string, data: ReviewCredentialData) => Promise<void>

  // Utilidades
  clearError: () => void
  clearSuccess: () => void
  setLoading: (loading: boolean) => void
}

export const useUserStore = create<UserState>((set, get) => ({
  // Estado inicial
  users: [],
  usersPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  applications: [],
  applicationsStatusFilter: 'pending_validation',
  applicationsPagination: { page: 1, limit: 50, total: 0, totalPages: 0 }, // totalPages queda en 1 mientras no haya paginación real
  loading: false,
  error: null,
  success: null,

  // Acciones usuarios
  fetchUsers: async (page = 1, limit = get().usersPagination.limit, search?, role?, status?) => {
    try {
      set({ loading: true, error: null })
      const { users, pagination } = await UserAPI.listUsers({ page, limit, search, role, status })
      set({ users, usersPagination: pagination, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar usuarios'
      set({ error: message, loading: false })
      throw err
    }
  },

  approveTeacher: async (userId: string) => {
    try {
      set({ loading: true, error: null, success: null })
      const updated = await UserAPI.approveTeacher(userId)
      // Actualizar en lista local
      const users = get().users.map(u => u.id === userId ? updated : u)
      set({ users, loading: false, success: `Profesor ${updated.name} aprobado exitosamente` })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al aprobar profesor'
      set({ error: message, loading: false })
      throw err
    }
  },

  changeUserRole: async (userId: string, role: Role) => {
    try {
      set({ loading: true, error: null, success: null })
      const updated = await UserAPI.changeUserRole(userId, role)
      const users = get().users.map(u => u.id === userId ? updated : u)
      set({ users, loading: false, success: `Rol de ${updated.name} cambiado a ${updated.role}` })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cambiar rol'
      set({ error: message, loading: false })
      throw err
    }
  },

  suspendUser: async (userId: string, suspend: boolean) => {
    try {
      set({ loading: true, error: null, success: null })
      const updated = await UserAPI.suspendUser(userId, suspend)
      const users = get().users.map(u => u.id === userId ? updated : u)
      set({ users, loading: false, success: `Usuario ${updated.name} ${suspend ? 'suspendido' : 'activado'} exitosamente` })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cambiar estado del usuario'
      set({ error: message, loading: false })
      throw err
    }
  },

  // Acciones aplicaciones profesores
  setApplicationsStatusFilter: (status: string) => {
    set({ applicationsStatusFilter: status })
  },

  fetchTeacherApplications: async (statusOverride) => {
    try {
      set({ loading: true, error: null })
      const status = statusOverride ?? get().applicationsStatusFilter
      const param = status === 'all' ? undefined : status
      const response = await TeacherAPI.getPendingApplications(param)
      const applications = response.data.applications
      const total = response.data.total ?? applications.length
      set({ 
        applications, 
        applicationsPagination: { page: 1, limit: applications.length, total, totalPages: 1 },
        loading: false 
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar aplicaciones'
      set({ error: message, loading: false })
      throw err
    }
  },

  approveTeacherApplication: async (userId: string) => {
    try {
      set({ loading: true, error: null, success: null })
      const response = await TeacherAPI.approveTeacher(userId)
      // Marcar aplicación como active
      const applications = get().applications.map(app => app.user_id === userId ? { ...app, status: 'active' as const } : app)
      set({ applications, loading: false, success: 'Aplicación aprobada' })
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al aprobar aplicación'
      set({ error: message, loading: false })
      throw err
    }
  },

  rejectTeacherApplication: async (userId: string, reason: string) => {
    try {
      set({ loading: true, error: null, success: null })
      const response = await TeacherAPI.rejectTeacherApplication(userId, reason)
      // Marcar aplicación como rejected
      const applications = get().applications.map(app => app.user_id === userId ? { ...app, status: 'rejected' as const } : app)
      set({ applications, loading: false, success: 'Aplicación rechazada' })
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al rechazar aplicación'
      set({ error: message, loading: false })
      throw err
    }
  },

  reviewCredential: async (credentialId: string, data: ReviewCredentialData) => {
    try {
      set({ loading: true, error: null, success: null })
      const response = await TeacherAPI.reviewCredential(credentialId, data)
      // Actualizar credencial en applications
      const applications = get().applications.map(app => {
        if (!app.credentials) return app
        return {
          ...app,
          credentials: app.credentials.map(c => c.id === credentialId ? { ...c, verification_status: data.verification_status, rejection_reason: data.rejection_reason } : c)
        }
      })
      set({ applications, loading: false, success: 'Credencial revisada' })
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al revisar credencial'
      set({ error: message, loading: false })
      throw err
    }
  },

  // Utilidades
  clearError: () => set({ error: null }),
  clearSuccess: () => set({ success: null }),
  setLoading: (loading: boolean) => set({ loading }),
}))
