import type { Response } from 'express'
import type { AuthRequest } from '../types/common.types'
import { uploadToCloudinary } from '../services/upload.service'

/**
 * Controlador para subir archivos a Cloudinary
 * Solo usuarios autenticados pueden subir archivos
 */
export async function uploadFileController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se envió ningún archivo' })
    }

    const file = req.file

    // Determinar el tipo de recurso basado en el mimetype
    let resourceType: 'video' | 'raw' | 'auto' = 'auto'
    if (file.mimetype.startsWith('video/')) {
      resourceType = 'video'
    } else if (file.mimetype === 'application/pdf') {
      resourceType = 'raw'
    }

    // Determinar la carpeta según el tipo de archivo
    const folder = file.mimetype === 'application/pdf' ? 'course-materials/pdfs' : 'course-materials/videos'

    // Subir a Cloudinary
    const result = await uploadToCloudinary(file.buffer, folder, resourceType)

    return res.json({
      success: true,
      data: {
        url: result.url,
        publicId: result.publicId,
        resourceType: result.resourceType,
        format: result.format,
        size: result.bytes,
        originalName: file.originalname,
        mimetype: file.mimetype,
      },
      message: 'Archivo subido exitosamente',
    })
  } catch (err: any) {
    const msg = err?.message || 'Error al subir archivo'
    console.error('[Upload] Error:', msg, err)
    return res.status(500).json({ success: false, error: msg })
  }
}
