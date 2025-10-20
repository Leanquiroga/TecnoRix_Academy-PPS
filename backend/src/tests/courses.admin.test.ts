import { describe, it, expect, beforeAll, jest } from '@jest/globals'
import request from 'supertest'
import app from '../app'
import { UserRole } from '../types/auth.types'

describe('Admin Courses Endpoints - FASE 3 Epic 2', () => {
  jest.setTimeout(20000)

  let adminToken: string
  let teacherActiveToken: string
  let teacherActiveId: string
  let courseId: string

  beforeAll(async () => {
    console.time('[beforeAll] setup admin courses')
    
    // Admin
    const adminRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin Courses', email: `admin-courses-${Date.now()}@test.com`, password: 'admin123', role: UserRole.ADMIN })
    console.log('[beforeAll] admin register status:', adminRegister.status)
    adminToken = adminRegister.body.data.token

    // Teacher active: Registrar y aprobar
    const teacherActiveRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Teacher Course Admin', email: `teacher-course-admin-${Date.now()}@test.com`, password: 'password123', role: UserRole.TEACHER })
    teacherActiveId = teacherActiveRegister.body.data.user.id
    console.log('[beforeAll] teacher active register status:', teacherActiveRegister.status)
    
    await request(app)
      .put(`/api/admin/users/${teacherActiveId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
    console.log('[beforeAll] teacher active approved')
    
    teacherActiveToken = teacherActiveRegister.body.data.token

    // Crear un curso pendiente
    const courseCreate = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${teacherActiveToken}`)
      .send({ 
        title: 'Curso para Aprobar', 
        description: 'Descripción test',
        price: 50
      })
    courseId = courseCreate.body.data.id
    console.log('[beforeAll] curso creado:', courseId)
    
    console.timeEnd('[beforeAll] setup admin courses')
  })

  describe('GET /api/admin/courses/pending (admin)', () => {
    it('Debe requerir autenticación', async () => {
      const response = await request(app).get('/api/admin/courses/pending')
      expect(response.status).toBe(401)
    })

    it('Debe requerir rol admin', async () => {
      const response = await request(app)
        .get('/api/admin/courses/pending')
        .set('Authorization', `Bearer ${teacherActiveToken}`)
      expect(response.status).toBe(403)
    })

    it('Debe listar cursos pendientes (admin)', async () => {
      const response = await request(app)
        .get('/api/admin/courses/pending')
        .set('Authorization', `Bearer ${adminToken}`)
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
      const pending = response.body.data.find((c: any) => c.id === courseId)
      expect(pending).toBeDefined()
      expect(pending.status).toBe('pending_approval')
    })
  })

  describe('PUT /api/admin/courses/:id/approve (admin)', () => {
    it('Debe requerir autenticación', async () => {
      const response = await request(app).put(`/api/admin/courses/${courseId}/approve`)
      expect(response.status).toBe(401)
    })

    it('Debe requerir rol admin', async () => {
      const response = await request(app)
        .put(`/api/admin/courses/${courseId}/approve`)
        .set('Authorization', `Bearer ${teacherActiveToken}`)
      expect(response.status).toBe(403)
    })

    it('Debe aprobar curso (admin)', async () => {
      const response = await request(app)
        .put(`/api/admin/courses/${courseId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('approved')
    })

    it('Debe fallar si curso no está pendiente', async () => {
      const response = await request(app)
        .put(`/api/admin/courses/${courseId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/admin/courses/:id/reject (admin)', () => {
    let courseIdToReject: string

    beforeAll(async () => {
      // Crear otro curso para rechazar
      const courseCreate = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${teacherActiveToken}`)
        .send({ 
          title: 'Curso para Rechazar', 
          description: 'Descripción test rechazo',
          price: 30
        })
      courseIdToReject = courseCreate.body.data.id
    })

    it('Debe requerir autenticación', async () => {
      const response = await request(app).put(`/api/admin/courses/${courseIdToReject}/reject`)
      expect(response.status).toBe(401)
    })

    it('Debe requerir rol admin', async () => {
      const response = await request(app)
        .put(`/api/admin/courses/${courseIdToReject}/reject`)
        .set('Authorization', `Bearer ${teacherActiveToken}`)
      expect(response.status).toBe(403)
    })

    it('Debe rechazar curso con razón (admin)', async () => {
      const response = await request(app)
        .put(`/api/admin/courses/${courseIdToReject}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Contenido inapropiado' })
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('rejected')
    })
  })
})
