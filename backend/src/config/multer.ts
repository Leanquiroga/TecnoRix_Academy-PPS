import multer from 'multer'
import type { Request } from 'express'

// Usar memoria storage para subir directamente a Cloudinary sin guardar en disco
const storage = multer.memoryStorage()

// Filtro de archivos: solo PDF y videos
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/webm'
  ]

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten PDFs y videos.'))
  }
}

// Configuración de multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB máximo
  },
})
