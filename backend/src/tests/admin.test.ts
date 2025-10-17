/**
 * Script de prueba para endpoints de administración
 * FASE 2: Gestión de Usuarios y Roles
 * 
 * Ejecutar con: npm run test
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import request from 'supertest'
import app from '../app'
import { UserRole, UserStatus } from '../types/auth.types'

describe('Admin Endpoints - FASE 2', () => {
  let adminToken: string
  let studentToken: string
  let studentId: string
  let teacherId: string

  beforeAll(async () => {
    // Registrar un admin para los tests
    const adminRegister = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin Test',
        email: `admin-${Date.now()}@test.com`,
        password: 'admin123',
        role: UserRole.ADMIN,
      })

    if (adminRegister.status !== 201) {
      throw new Error('No se pudo registrar el admin para los tests.')
    }

    adminToken = adminRegister.body.data.token

    // Registrar un estudiante
    const studentRegister = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Estudiante Test',
        email: `student-${Date.now()}@test.com`,
        password: 'password123',
        role: UserRole.STUDENT,
      })

    studentId = studentRegister.body.data.user.id
    studentToken = studentRegister.body.data.token

    // Registrar un teacher (quedará pendiente)
    const teacherRegister = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Teacher Test',
        email: `teacher-${Date.now()}@test.com`,
        password: 'password123',
        role: UserRole.TEACHER,
      })

    teacherId = teacherRegister.body.data.user.id
  })

  describe('GET /api/admin/users', () => {
    it('Debe retornar 401 sin token', async () => {
      const response = await request(app).get('/api/admin/users')
      expect(response.status).toBe(401)
    })

    it('Debe retornar 403 con token de estudiante', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${studentToken}`)
      expect(response.status).toBe(403)
    })

    it('Debe retornar lista de usuarios con token de admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('Debe filtrar usuarios por rol', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=student')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      response.body.data.forEach((user: any) => {
        expect(user.role).toBe(UserRole.STUDENT)
      })
    })

    it('Debe filtrar usuarios por status', async () => {
      const response = await request(app)
        .get('/api/admin/users?status=pending_validation')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      response.body.data.forEach((user: any) => {
        expect(user.status).toBe(UserStatus.PENDING_VALIDATION)
      })
    })
  })

  describe('PUT /api/admin/users/:id/approve', () => {
    it('Debe retornar 401 sin token', async () => {
      const response = await request(app).put(`/api/admin/users/${teacherId}/approve`)
      expect(response.status).toBe(401)
    })

    it('Debe retornar 403 con token de estudiante', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${teacherId}/approve`)
        .set('Authorization', `Bearer ${studentToken}`)
      expect(response.status).toBe(403)
    })

    it('Debe retornar 404 con ID inexistente', async () => {
      const response = await request(app)
        .put('/api/admin/users/00000000-0000-0000-0000-000000000000/approve')
        .set('Authorization', `Bearer ${adminToken}`)
      expect(response.status).toBe(404)
    })

    it('Debe retornar 400 si el usuario no es teacher', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${studentId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('no es un profesor')
    })

    it('Debe aprobar un teacher correctamente', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${teacherId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe(UserStatus.ACTIVE)
      expect(response.body.message).toContain('aprobado')
    })

    it('Debe retornar 400 si el teacher ya está aprobado', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${teacherId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('no está pendiente')
    })
  })

  describe('PUT /api/admin/users/:id/role', () => {
    it('Debe retornar 401 sin token', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${studentId}/role`)
        .send({ role: UserRole.TEACHER })
      expect(response.status).toBe(401)
    })

    it('Debe retornar 400 sin rol en el body', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${studentId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
      expect(response.status).toBe(400)
    })

    it('Debe retornar 400 con rol inválido', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${studentId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'invalid_role' })
      expect(response.status).toBe(400)
    })

    it('Debe cambiar el rol de un usuario correctamente', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${studentId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.TEACHER })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.role).toBe(UserRole.TEACHER)
      expect(response.body.message).toContain('actualizado')
    })
  })

  describe('PUT /api/admin/users/:id/suspend', () => {
    it('Debe retornar 401 sin token', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${studentId}/suspend`)
        .send({ suspend: true })
      expect(response.status).toBe(401)
    })

    it('Debe retornar 400 sin parámetro suspend', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${studentId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
      expect(response.status).toBe(400)
    })

    it('Debe suspender un usuario correctamente', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${studentId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ suspend: true })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe(UserStatus.SUSPENDED)
      expect(response.body.message).toContain('suspendido')
    })

    it('Usuario suspendido no debe poder hacer login', async () => {
      // Obtener email del usuario suspendido
      const userResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)

      const suspendedUser = userResponse.body.data.find(
        (u: any) => u.id === studentId
      )

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: suspendedUser.email,
          password: 'password123',
        })

      expect(loginResponse.status).toBe(403)
      expect(loginResponse.body.error).toContain('suspendido')
    })

    it('Debe activar un usuario suspendido', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${studentId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ suspend: false })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe(UserStatus.ACTIVE)
      expect(response.body.message).toContain('activado')
    })
  })
})
