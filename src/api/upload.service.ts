import http from './http'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '../types/common'

export interface UploadResponse {
  url: string
  publicId: string
  resourceType: 'image' | 'video' | 'raw'
  format?: string
  size: number
  originalName: string
  mimetype: string
}

export async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const { data } = await http.post<ApiResponse<UploadResponse>>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    if (!data.success) throw new Error(data.error || 'Error al subir archivo')
    return data.data as UploadResponse
  } catch (err) {
    const axErr = err as AxiosError<any>
    const status = axErr.response?.status
    const message = axErr.response?.data?.error
    if (status === 401) {
      throw new Error('No autorizado: inicia sesión para subir archivos.')
    }
    throw new Error(message || (axErr as any)?.message || 'Error al subir archivo')
  }
}

// Upload público para credenciales (PDF, máx 5MB)
export async function uploadCredentialPublic(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const { data } = await http.post<ApiResponse<UploadResponse>>('/public/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    if (!data.success) throw new Error(data.error || 'Error al subir archivo')
    return data.data as UploadResponse
  } catch (err: any) {
    throw new Error(err?.response?.data?.error || err?.message || 'Error al subir archivo')
  }
}
