import http from './http'
import type { ApiResponse } from '../types/common'
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../types/auth'
import { AxiosError } from 'axios'

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  try {
    const { data } = await http.post<ApiResponse<{ user: User; token: string }>>('/auth/register', payload)
    if (!data.success || !data.data) throw new Error(data.error || 'Registro fallido')
    return data.data
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw error
  }
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  try {
    const { data } = await http.post<ApiResponse<{ user: User; token: string }>>('/auth/login', payload)
    if (!data.success || !data.data) throw new Error(data.error || 'Login fallido')
    return data.data
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw error
  }
}

export async function me(): Promise<User> {
  try {
    const { data } = await http.get<ApiResponse<User>>('/auth/me')
    if (!data.success || !data.data) throw new Error(data.error || 'No se pudo obtener el perfil')
    return data.data
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw error
  }
}

export async function refresh(): Promise<string> {
  try {
    const { data } = await http.post<ApiResponse<{ token: string }>>('/auth/refresh')
    if (!data.success || !data.data) throw new Error(data.error || 'No se pudo renovar el token')
    return data.data.token
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw error
  }
}

// ============================================
// PASSWORD RECOVERY - FASE 6.6
// ============================================

export async function forgotPassword(email: string): Promise<string> {
  try {
    const { data } = await http.post<ApiResponse<never>>('/auth/forgot-password', { email })
    if (!data.success) throw new Error(data.error || 'Error al enviar email de recuperación')
    return data.message || 'Si el email existe, recibirás un link de recuperación'
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw error
  }
}

export async function resetPassword(access_token: string, newPassword: string): Promise<string> {
  try {
    const { data} = await http.post<ApiResponse<never>>('/auth/reset-password', { access_token, newPassword })
    if (!data.success) throw new Error(data.error || 'Error al restablecer contraseña')
    return data.message || 'Contraseña actualizada exitosamente'
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw error
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<string> {
  const { data } = await http.post<ApiResponse<{ message: string }>>('/auth/change-password', { currentPassword, newPassword })
  if (!data.success) throw new Error(data.error || 'Error al cambiar contraseña')
  return data.message || 'Contraseña actualizada'
}
