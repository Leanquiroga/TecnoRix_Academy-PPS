import http from './http'
import type { ApiResponse } from '../types/common'
import type { User, Role, UserStatus } from '../types/auth'
import { AxiosError } from 'axios'

export interface GetUsersFilters {
  role?: Role
  status?: UserStatus
}

export async function getUsers(filters?: GetUsersFilters): Promise<User[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.role) params.append('role', filters.role)
    if (filters?.status) params.append('status', filters.status)
    
    const queryString = params.toString()
    const url = `/admin/users${queryString ? `?${queryString}` : ''}`
    
    const { data } = await http.get<ApiResponse<User[]>>(url)
    if (!data.success || !data.data) throw new Error(data.error || 'Error al obtener usuarios')
    return data.data
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
