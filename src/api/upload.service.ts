import http from './http'
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

  const { data } = await http.post<ApiResponse<UploadResponse>>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  if (!data.success) throw new Error(data.error || 'Error al subir archivo')
  return data.data as UploadResponse
}
