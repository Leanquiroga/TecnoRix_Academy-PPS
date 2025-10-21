import { describe, it, expect, beforeAll, jest } from '@jest/globals'
import request from 'supertest'
import app from '../app'
import { UserRole } from '../types/auth.types'

describe('Courses Endpoints - FASE 3 Epic 2', () => {
  // Aumentar timeout porque los registros en Supabase pueden tardar >5s
  jest.setTimeout(20000)
  let adminToken: string
  let studentToken: string
  let teacherPendingToken: string
  let teacherActiveToken: string

  beforeAll(async () => {
    console.time('[beforeAll] setup cursos')
    // Admin
    const adminRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin C', email: `admin-c-${Date.now()}@test.com`, password: 'admin123', role: UserRole.ADMIN })
    console.log('[beforeAll] admin register status:', adminRegister.status)
    adminToken = adminRegister.body.data.token

    // Student
    const studentRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Student C', email: `student-c-${Date.now()}@test.com`, password: 'password123', role: UserRole.STUDENT })
    console.log('[beforeAll] student register status:', studentRegister.status)
    studentToken = studentRegister.body.data.token

    // Teacher (pending)
    const teacherPendingRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Teacher Pending', email: `teacher-p-${Date.now()}@test.com`, password: 'password123', role: UserRole.TEACHER })
    console.log('[beforeAll] teacher pending register status:', teacherPendingRegister.status)
    teacherPendingToken = teacherPendingRegister.body.data.token

    // Teacher active: Registrar y aprobar vía admin endpoint
    const teacherActiveRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Teacher Active', email: `teacher-a-${Date.now()}@test.com`, password: 'password123', role: UserRole.TEACHER })
    const teacherActiveId = teacherActiveRegister.body.data.user.id
    console.log('[beforeAll] teacher active register status:', teacherActiveRegister.status)
    await request(app)
      .put(`/api/admin/users/${teacherActiveId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
    console.log('[beforeAll] teacher active approved via admin')
    teacherActiveToken = teacherActiveRegister.body.data.token
    console.timeEnd('[beforeAll] setup cursos')
  })

  describe('GET /api/courses (public)', () => {
    it('Debe listar cursos aprobados (vacío inicialmente)', async () => {
      const response = await request(app).get('/api/courses')
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('POST /api/courses (teacher)', () => {
    it('Debe requerir autenticación', async () => {
      const response = await request(app)
        .post('/api/courses')
        .send({ title: 'Curso 1', description: 'Desc 1' })
      expect(response.status).toBe(401)
    })

    it('Debe rechazar creación por estudiante', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Curso Est', description: 'No permitido' })
      expect(response.status).toBe(403)
    })

    it('Debe rechazar creación si teacher está pendiente', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${teacherPendingToken}`)
        .send({ title: 'Curso Pend', description: 'Pendiente' })
      expect(response.status).toBe(403)
    })

    it('Debe crear curso con teacher activo y dejarlo pendiente de aprobación', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${teacherActiveToken}`)
        .send({ title: 'Node desde 0', description: 'Intro a Node', price: 10 })
      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('pending_approval')
    })
  })

  describe('GET /api/courses/:id/materials (public)', () => {
    let approvedCourseId: string

    beforeAll(async () => {
      // Crear curso con materiales
      const courseResponse = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${teacherActiveToken}`)
        .send({
          title: 'Curso con Materiales',
          description: 'Curso de prueba con materiales',
          price: 20,
          materials: [
            { title: 'Introducción', type: 'video', url: 'https://example.com/video1.mp4', order: 1 },
            { title: 'Documentación', type: 'pdf', url: 'https://example.com/doc.pdf', order: 2 },
            { title: 'Recursos externos', type: 'link', url: 'https://example.com', order: 3 },
          ]
        })

      const courseId = courseResponse.body.data.id

      // Aprobar el curso para que sea público
      await request(app)
        .put(`/api/admin/courses/${courseId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)

      approvedCourseId = courseId
    })

    it('Debe retornar los materiales de un curso aprobado', async () => {
      const response = await request(app).get(`/api/courses/${approvedCourseId}/materials`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBe(3)

      // Verificar orden
      const materials = response.body.data
      expect(materials[0].title).toBe('Introducción')
      expect(materials[0].type).toBe('video')
      expect(materials[1].title).toBe('Documentación')
      expect(materials[1].type).toBe('pdf')
      expect(materials[2].title).toBe('Recursos externos')
      expect(materials[2].type).toBe('link')
    })

    it('Debe retornar array vacío si el curso no tiene materiales', async () => {
      // Crear curso sin materiales
      const courseResponse = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${teacherActiveToken}`)
        .send({
          title: 'Curso sin Materiales',
          description: 'Curso vacío',
          price: 0
        })

      const courseId = courseResponse.body.data.id

      // Aprobar el curso
      await request(app)
        .put(`/api/admin/courses/${courseId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)

      const response = await request(app).get(`/api/courses/${courseId}/materials`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBe(0)
    })

    it('Debe funcionar sin autenticación (endpoint público)', async () => {
      const response = await request(app).get(`/api/courses/${approvedCourseId}/materials`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })
})
