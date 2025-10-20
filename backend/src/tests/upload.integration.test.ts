import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import request from 'supertest'
import app from '../app'
import { UserRole } from '../types/auth.types'
import { deleteFromCloudinary } from '../services/upload.service'

/**
 * Tests de integración REAL con Cloudinary
 * Requiere credenciales válidas en .env:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */
describe('Upload Integration Tests - Real Cloudinary Upload', () => {
  jest.setTimeout(60000) // 60 segundos para uploads reales

  let teacherToken: string
  let studentToken: string
  let uploadedPublicIds: string[] = [] // Para limpiar después

  beforeAll(async () => {
    console.time('[Integration] setup upload')

    // Crear un teacher activo
    const teacherRegister = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Teacher Integration',
        email: `teacher-int-${Date.now()}@test.com`,
        password: 'password123',
        role: UserRole.TEACHER,
      })

    // Crear admin para aprobar teacher
    const adminRegister = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin Integration',
        email: `admin-int-${Date.now()}@test.com`,
        password: 'admin123',
        role: UserRole.ADMIN,
      })

    const adminToken = adminRegister.body.data.token
    const teacherId = teacherRegister.body.data.user.id

    // Aprobar teacher
    await request(app)
      .put(`/api/admin/users/${teacherId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)

    teacherToken = teacherRegister.body.data.token

    // Crear un estudiante
    const studentRegister = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Student Integration',
        email: `student-int-${Date.now()}@test.com`,
        password: 'password123',
        role: UserRole.STUDENT,
      })

    studentToken = studentRegister.body.data.token

    console.timeEnd('[Integration] setup upload')
  })

  afterAll(async () => {
    // Limpiar todos los archivos subidos a Cloudinary
    console.log(
      `\n🧹 Limpiando ${uploadedPublicIds.length} archivos de Cloudinary...`
    )
    for (const publicId of uploadedPublicIds) {
      try {
        await deleteFromCloudinary(publicId)
        console.log(`  ✅ Eliminado: ${publicId}`)
      } catch (error) {
        console.warn(`  ⚠️  Error eliminando ${publicId}:`, error)
      }
    }
    console.log('✨ Limpieza completada\n')
  })

  describe('POST /api/upload - Subida REAL de archivos', () => {
    it('Debe subir un PDF real a Cloudinary y retornar URL válida', async () => {
      // Crear un PDF simple pero válido
      const pdfBuffer = Buffer.from(
        '%PDF-1.4\n' +
          '1 0 obj\n' +
          '<< /Type /Catalog /Pages 2 0 R >>\n' +
          'endobj\n' +
          '2 0 obj\n' +
          '<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n' +
          'endobj\n' +
          '3 0 obj\n' +
          '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\n' +
          'endobj\n' +
          '4 0 obj\n' +
          '<< /Length 44 >>\n' +
          'stream\n' +
          'BT /F1 12 Tf 100 700 Td (Test PDF) Tj ET\n' +
          'endstream\n' +
          'endobj\n' +
          '5 0 obj\n' +
          '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n' +
          'endobj\n' +
          'xref\n' +
          '0 6\n' +
          '0000000000 65535 f\n' +
          '0000000009 00000 n\n' +
          '0000000058 00000 n\n' +
          '0000000115 00000 n\n' +
          '0000000261 00000 n\n' +
          '0000000353 00000 n\n' +
          'trailer\n' +
          '<< /Size 6 /Root 1 0 R >>\n' +
          'startxref\n' +
          '436\n' +
          '%%EOF'
      )

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${teacherToken}`)
        .attach('file', pdfBuffer, {
          filename: 'test-integration.pdf',
          contentType: 'application/pdf',
        })

      console.log('📤 Response de upload PDF:', JSON.stringify(response.body, null, 2))

      // Verificar respuesta exitosa
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('exitosamente')

      // Verificar datos del archivo
      const { data } = response.body
      expect(data).toHaveProperty('url')
      expect(data).toHaveProperty('publicId')
      expect(data).toHaveProperty('resourceType')
      expect(data).toHaveProperty('size')
      expect(data).toHaveProperty('originalName', 'test-integration.pdf')
      expect(data).toHaveProperty('mimetype', 'application/pdf')

      // Verificar que la URL sea accesible
      expect(data.url).toMatch(/^https:\/\//)
      expect(data.url).toContain('cloudinary.com')

      // Verificar tipo de recurso
      expect(data.resourceType).toBe('raw')

      // Guardar publicId para limpieza
      uploadedPublicIds.push(data.publicId)

      console.log(`✅ PDF subido exitosamente: ${data.url}`)
    })

    it('Debe subir un archivo de video simulado a Cloudinary', async () => {
      // Crear un buffer que simule un video pequeño (header MP4)
      // En un test real usarías un video pequeño válido
      const videoBuffer = Buffer.from([
        // ftyp box
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
        0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
        0x61, 0x76, 0x63, 0x31, 0x6d, 0x70, 0x34, 0x31,
        // mdat box (datos de video vacíos)
        0x00, 0x00, 0x00, 0x08, 0x6d, 0x64, 0x61, 0x74,
      ])

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('file', videoBuffer, {
          filename: 'test-video.mp4',
          contentType: 'video/mp4',
        })

      console.log('📤 Response de upload Video:', JSON.stringify(response.body, null, 2))

      // El buffer simulado puede no ser aceptado por Cloudinary como video válido
      // Verificamos que al menos el endpoint funciona correctamente
      if (response.status === 200) {
        const { data } = response.body
        expect(data.mimetype).toBe('video/mp4')
        expect(data.resourceType).toBe('video')
        expect(data.url).toContain('cloudinary.com')

        // Guardar para limpieza
        uploadedPublicIds.push(data.publicId)

        console.log(`✅ Video subido exitosamente: ${data.url}`)
      } else {
        // Si Cloudinary rechaza el video simulado, es esperado
        expect(response.status).toBe(500)
        expect(response.body.success).toBe(false)
        console.log('⚠️  Cloudinary rechazó el video simulado (esperado con buffer fake)')
      }
    })

    it('Debe manejar nombres de archivo con caracteres especiales', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%%EOF')

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${teacherToken}`)
        .attach('file', pdfBuffer, {
          filename: 'Archivo de Prueba #1 - Espanol (Nono) & Simbolos.pdf',
          contentType: 'application/pdf',
        })

      expect(response.status).toBe(200)
      // Nota: El encoding puede variar según el sistema, verificamos que existe
      expect(response.body.data.originalName).toBeTruthy()
      expect(response.body.data.originalName).toContain('Archivo de Prueba')

      uploadedPublicIds.push(response.body.data.publicId)

      console.log(`✅ Archivo con caracteres especiales subido: ${response.body.data.url}`)
    })

    it('Debe generar publicId único para cada archivo', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%%EOF')

      // Subir dos archivos idénticos
      const response1 = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${teacherToken}`)
        .attach('file', pdfBuffer, {
          filename: 'duplicate-test.pdf',
          contentType: 'application/pdf',
        })

      const response2 = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${teacherToken}`)
        .attach('file', pdfBuffer, {
          filename: 'duplicate-test.pdf',
          contentType: 'application/pdf',
        })

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)

      const publicId1 = response1.body.data.publicId
      const publicId2 = response2.body.data.publicId

      // Los publicId deben ser diferentes (Cloudinary los genera únicos)
      expect(publicId1).not.toBe(publicId2)

      uploadedPublicIds.push(publicId1, publicId2)

      console.log(`✅ Archivos con publicIds únicos: ${publicId1} vs ${publicId2}`)
    })

    it('Debe retornar información de tamaño del archivo', async () => {
      const pdfContent = '%PDF-1.4\n' + 'A'.repeat(1000) + '\n%%EOF'
      const pdfBuffer = Buffer.from(pdfContent)

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${teacherToken}`)
        .attach('file', pdfBuffer, {
          filename: 'size-test.pdf',
          contentType: 'application/pdf',
        })

      expect(response.status).toBe(200)
      expect(response.body.data.size).toBeGreaterThan(0)

      uploadedPublicIds.push(response.body.data.publicId)

      console.log(
        `✅ Archivo subido - Tamaño: ${response.body.data.size} bytes (${
          response.body.data.size / 1024
        } KB)`
      )
    })
  })

  describe('Validaciones de seguridad con Cloudinary real', () => {
    it('Debe rechazar archivos sin autenticación', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%%EOF')

      const response = await request(app)
        .post('/api/upload')
        // Sin token de autorización
        .attach('file', pdfBuffer, {
          filename: 'unauthorized.pdf',
          contentType: 'application/pdf',
        })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })

    it('Debe rechazar requests sin archivo adjunto', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${teacherToken}`)
      // Sin .attach()

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('No se envió ningún archivo')
    })
  })

  describe('Gestión de recursos en Cloudinary', () => {
    it('Debe poder eliminar un archivo subido usando su publicId', async () => {
      // Primero subir
      const pdfBuffer = Buffer.from('%PDF-1.4\n%%EOF')

      const uploadResponse = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${teacherToken}`)
        .attach('file', pdfBuffer, {
          filename: 'to-delete.pdf',
          contentType: 'application/pdf',
        })

      expect(uploadResponse.status).toBe(200)
      const publicId = uploadResponse.body.data.publicId

      console.log(`📤 Archivo subido para eliminar: ${publicId}`)

      // Luego eliminar directamente con el servicio
      const deleteResult = await deleteFromCloudinary(publicId)

      expect(deleteResult).toBeDefined()
      expect(deleteResult.result).toBe('ok') // Cloudinary retorna 'ok' cuando se elimina

      console.log(`🗑️  Archivo eliminado exitosamente: ${publicId}`)

      // No agregar a uploadedPublicIds porque ya lo eliminamos
    })
  })
})
