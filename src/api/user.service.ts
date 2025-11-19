import http from './http'
import type { ApiResponse } from '../types/common'
import type { User, Role, UserStatus } from '../types/auth'
import { AxiosError } from 'axios'

export interface GetUsersFilters {
  role?: Role
  status?: UserStatus
}

export async function getUsers(filters?: GetUsersFilters): Promise<User[]> {
  // Mantener API antigua para compatibilidad (sin paginación)
  const { users } = await listUsers({ ...filters })
  return users
}

export interface ListUsersParams extends GetUsersFilters {
  page?: number
  limit?: number
  search?: string
}

export async function listUsers(params: ListUsersParams = {}): Promise<{ users: User[]; pagination: NonNullable<ApiResponse['pagination']> }> {
  try {
    const query: Record<string, string | number> = {}
    if (params.role) query.role = params.role
    if (params.status) query.status = params.status
    if (params.page) query.page = params.page
    if (params.limit) query.limit = params.limit
    if (params.search) query.search = params.search

    const { data } = await http.get<ApiResponse<User[]>>('/admin/users', { params: query })
    if (!data.success || !data.data) throw new Error(data.error || 'Error al obtener usuarios')
    return { users: data.data, pagination: data.pagination! }
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw error
  }
}

export async function approveTeacher(userId: string): Promise<User> {
  try {
    const { data } = await http.put<ApiResponse<User>>(`/admin/users/${userId}/approve`)
    if (!data.success || !data.data) throw new Error(data.error || 'Error al aprobar profesor')
    return data.data
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw error
  }
}

export async function changeUserRole(userId: string, role: Role): Promise<User> {
  try {
    const { data } = await http.put<ApiResponse<User>>(`/admin/users/${userId}/role`, { role })
    if (!data.success || !data.data) throw new Error(data.error || 'Error al cambiar rol')
    return data.data
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw error
  }
}

export async function suspendUser(userId: string, suspend: boolean): Promise<User> {
  try {
    const { data } = await http.put<ApiResponse<User>>(`/admin/users/${userId}/suspend`, { suspend })
    if (!data.success || !data.data) throw new Error(data.error || 'Error al cambiar estado del usuario')
    return data.data
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw error
  }
}

export interface UpdateProfilePayload {
  name?: string
  bio?: string | null
  country?: string | null
  avatar_url?: string | null
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  try {
    const { data } = await http.put<ApiResponse<User>>('/users/profile', payload)
    if (!data.success || !data.data) throw new Error(data.error || 'Error al actualizar perfil')
    return data.data
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw error
  }
}

// Activity summary types
export type ActivitySummary =
  | { role: 'student'; totalEnrolled: number; averageProgress: number; certificates: number }
  | { role: 'teacher'; totalCourses: number; totalStudents: number }
  | { role: 'admin'; totalUsers: number; totalCourses: number; totalQuizzes: number }

export async function getActivitySummary(): Promise<ActivitySummary> {
  const { data } = await http.get<ApiResponse<ActivitySummary>>('/users/activity')
  if (!data.success || !data.data) throw new Error(data.error || 'Error obteniendo actividad')
  return data.data
}
