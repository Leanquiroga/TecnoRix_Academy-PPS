import { useState, useCallback } from 'react'
import { uploadFile, type UploadResponse } from '../api/upload.service'

export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResponse | null>(null)

  const upload = useCallback(async (file: File) => {
    setError(null)
    setResult(null)

    // Validación de archivo
    if (!file.type) {
      setError('Por favor, selecciona un archivo.')
      return null
    }

    // Validaciones básicas: tipo permitido y tamaño (<=100MB)
    const allowed = ['application/pdf', 'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm']
    const maxBytes = 100 * 1024 * 1024
    
    if (!allowed.includes(file.type)) {
      setError('Tipo de archivo no permitido. Solo se aceptan PDF o videos (MP4, MPEG, QuickTime, AVI, WMV, WebM).')
      return null
    }
    
    if (file.size > maxBytes) {
      setError('El archivo es demasiado grande. Tamaño máximo: 100MB.')
      return null
    }

    try {
      setUploading(true)
      const res = await uploadFile(file)
      setResult(res)
      return res
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al subir archivo'
      setError(msg)
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  return { uploading, error, result, upload }
}
