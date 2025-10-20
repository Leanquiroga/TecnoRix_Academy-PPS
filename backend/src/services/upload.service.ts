import cloudinary from '../config/cloudinary'
import { Readable } from 'stream'

export interface UploadResult {
  url: string
  publicId: string
  resourceType: 'image' | 'video' | 'raw'
  format: string
  bytes: number
}

/**
 * Sube un archivo a Cloudinary desde un buffer
 * @param buffer Buffer del archivo
 * @param folder Carpeta en Cloudinary
 * @param resourceType Tipo de recurso (auto, video, raw, image)
 * @returns Información del archivo subido
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: 'auto' | 'video' | 'raw' | 'image' = 'auto'
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type as 'image' | 'video' | 'raw',
            format: result.format,
            bytes: result.bytes,
          })
        } else {
          reject(new Error('No se recibió respuesta de Cloudinary'))
        }
      }
    )

    // Convertir buffer a stream y pipe a Cloudinary
    const readableStream = Readable.from(buffer)
    readableStream.pipe(uploadStream)
  })
}

/**
 * Elimina un archivo de Cloudinary
 * @param publicId ID público del archivo
 * @param resourceType Tipo de recurso
 * @returns Resultado de la operación de eliminación
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'raw'
): Promise<{ result: string }> {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  })
  return result
}
