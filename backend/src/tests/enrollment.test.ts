import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import request from 'supertest'
import express, { Express } from 'express'
import enrollmentRoutes from '../routes/enrollment.routes'
import courseRoutes from '../routes/course.routes'
import authRoutes from '../routes/auth.routes'
import { supabaseAdmin } from '../config/supabase'
import {
  authenticatedRequest,
  createTestCourse,
  createTestEnrollment,
  type EnrollmentWithCourseResponse,
} from './test-helpers'

// Configurar express para tests
const app: Express = express()
app.use(express.json())
app.use('/api/enrollments', enrollmentRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/auth', authRoutes)

// Variables globales para tests
let studentToken: string
let teacherToken: string
let studentUserId: string
let teacherUserId: string
let testCourseId: string
let paidCourseId: string // Para tests de cursos pagos

describe('Enrollment Endpoints', () => {
  // Setup: Crear usuarios y cursos de prueba
  beforeAll(async () => {
    // Registrar estudiante
    const studentRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Student',
        email: `student-${Date.now()}@test.com`,
        password: 'Password123!',
        role: 'student',
      })

    // Validar registro exitoso
    if (!studentRes.body.data?.token || !studentRes.body.data?.user?.id) {
      throw new Error(`Failed to register student: ${JSON.stringify(studentRes.body)}`)
    }

    studentToken = studentRes.body.data.token
    studentUserId = studentRes.body.data.user.id

    // Registrar teacher
    const teacherRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Teacher',
        email: `teacher-${Date.now()}@test.com`,
        password: 'Password123!',
        role: 'teacher',
      })

    // Validar registro exitoso
    if (!teacherRes.body.data?.token || !teacherRes.body.data?.user?.id) {
      throw new Error(`Failed to register teacher: ${JSON.stringify(teacherRes.body)}`)
    }

    teacherToken = teacherRes.body.data.token
    teacherUserId = teacherRes.body.data.user.id

    // Aprobar teacher manualmente en BD
    const { error: approveError } = await supabaseAdmin
      .from('users')
      .update({ status: 'active' })
      .eq('id', teacherUserId)

    if (approveError) {
      throw new Error(`Failed to approve teacher: ${approveError.message}`)
    }

    // Crear curso gratuito
    const freeCourse = await createTestCourse({
      teacher_id: teacherUserId,
      title: 'Test Free Course',
      price: 0,
    })
    testCourseId = freeCourse.id

    // Crear curso pago
    const paidCourse = await createTestCourse({
      teacher_id: teacherUserId,
      title: 'Test Paid Course',
      price: 99.99,
    })
    paidCourseId = paidCourse.id
  })

  // Cleanup: Eliminar TODOS los datos de prueba
  afterAll(async () => {
    // Limpiar TODOS los enrollments del estudiante de test
    if (studentUserId) {
      await supabaseAdmin
        .from('enrollments')
        .delete()
        .eq('student_id', studentUserId)
    }

    // Limpiar TODOS los cursos del teacher de test
    if (teacherUserId) {
      await supabaseAdmin
        .from('courses')
        .delete()
        .eq('teacher_id', teacherUserId)
    }

    // Limpiar usuarios de test
    if (studentUserId) {
      await supabaseAdmin.from('users').delete().eq('id', studentUserId)
    }
    if (teacherUserId) {
      await supabaseAdmin.from('users').delete().eq('id', teacherUserId)
    }
  })

  describe('POST /api/enrollments', () => {
    it('debe inscribir a un estudiante en un curso gratuito', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .post('/api/enrollments')
        .send({
          course_id: testCourseId,
        })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('enrollment')
      expect(res.body.enrollment.student_id).toBe(studentUserId)
      expect(res.body.enrollment.course_id).toBe(testCourseId)
      expect(res.body.enrollment.status).toBe('active')
      expect(res.body.enrollment.progress).toBe(0)
      expect(res.body.requires_payment).toBe(false)
    })

    it('debe inscribir en curso pago con status pending_payment', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .post('/api/enrollments')
        .send({
          course_id: paidCourseId,
        })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('enrollment')
      expect(res.body.enrollment.student_id).toBe(studentUserId)
      expect(res.body.enrollment.course_id).toBe(paidCourseId)
      expect(res.body.enrollment.status).toBe('pending_payment')
      expect(res.body.enrollment.progress).toBe(0)
      expect(res.body.requires_payment).toBe(true)
    })

    it('debe fallar si el estudiante ya está inscrito', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .post('/api/enrollments')
        .send({
          course_id: testCourseId,
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('Ya estás inscrito')
    })

    it('debe fallar sin autenticación', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .send({
          course_id: testCourseId,
        })

      expect(res.status).toBe(401)
    })

    it('debe fallar si falta course_id', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .post('/api/enrollments')
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('curso es requerido')
    })

    it('debe fallar si el curso no existe', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .post('/api/enrollments')
        .send({
          course_id: '00000000-0000-0000-0000-000000000000',
        })

      expect(res.status).toBe(404)
      expect(res.body.error).toContain('Curso no encontrado')
    })
  })

  describe('GET /api/enrollments/my-courses', () => {
    it('debe obtener los cursos del estudiante', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .get('/api/enrollments/my-courses')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
      expect(res.body[0]).toHaveProperty('course')
      expect(res.body[0].course).toHaveProperty('title')
      expect(res.body[0].student_id).toBe(studentUserId)
    })

    it('debe filtrar por estado', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .get('/api/enrollments/my-courses?status=active')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      res.body.forEach((enrollment: EnrollmentWithCourseResponse) => {
        expect(enrollment.status).toBe('active')
      })
    })

    it('debe fallar sin autenticación', async () => {
      const res = await request(app).get('/api/enrollments/my-courses')

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/enrollments/stats/student', () => {
    it('debe obtener estadísticas del estudiante', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .get('/api/enrollments/stats/student')

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('total_courses')
      expect(res.body).toHaveProperty('active_courses')
      expect(res.body).toHaveProperty('completed_courses')
      expect(res.body).toHaveProperty('average_progress')
      expect(typeof res.body.total_courses).toBe('number')
      expect(res.body.total_courses).toBeGreaterThan(0)
    })

    it('debe fallar sin autenticación', async () => {
      const res = await request(app).get('/api/enrollments/stats/student')

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/enrollments/:id', () => {
    let enrollmentId: string
    let tempCourseId: string

    beforeEach(async () => {
      // Crear curso temporal para evitar conflictos de inscripción duplicada
      const tempCourse = await createTestCourse({
        teacher_id: teacherUserId,
        title: `Temp Course GET ${Date.now()}`,
      })
      tempCourseId = tempCourse.id

      // Aprobar el curso temporal
      await supabaseAdmin
        .from('courses')
        .update({ approval_status: 'approved' })
        .eq('id', tempCourseId)

      // Crear enrollment específica para estos tests
      const enrollment = await createTestEnrollment({
        app,
        studentToken,
        course_id: tempCourseId,
      })
      enrollmentId = enrollment.id
    })

    afterEach(async () => {
      // Limpiar enrollment y curso temporal
      if (enrollmentId) {
        await supabaseAdmin.from('enrollments').delete().eq('id', enrollmentId)
      }
      if (tempCourseId) {
        await supabaseAdmin.from('courses').delete().eq('id', tempCourseId)
      }
    })

    it('debe obtener detalles de una inscripción', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .get(`/api/enrollments/${enrollmentId}`)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(enrollmentId)
      expect(res.body).toHaveProperty('course')
      expect(res.body.course).toHaveProperty('title')
    })

    it('debe fallar si la inscripción no existe', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .get('/api/enrollments/00000000-0000-0000-0000-000000000000')

      expect(res.status).toBe(404)
    })

    it('debe fallar sin autenticación', async () => {
      const res = await request(app).get(`/api/enrollments/${enrollmentId}`)

      expect(res.status).toBe(401)
    })
  })

  describe('PUT /api/enrollments/:id/progress', () => {
    let enrollmentId: string
    let tempCourseId: string

    beforeEach(async () => {
      // Crear curso temporal para evitar conflictos de inscripción duplicada
      const tempCourse = await createTestCourse({
        teacher_id: teacherUserId,
        title: `Temp Course PUT ${Date.now()}`,
      })
      tempCourseId = tempCourse.id

      // Aprobar el curso temporal
      await supabaseAdmin
        .from('courses')
        .update({ approval_status: 'approved' })
        .eq('id', tempCourseId)

      // Crear enrollment específica para cada test de progreso
      const enrollment = await createTestEnrollment({
        app,
        studentToken,
        course_id: tempCourseId,
      })
      enrollmentId = enrollment.id
    })

    afterEach(async () => {
      // Limpiar enrollment y curso temporal
      if (enrollmentId) {
        await supabaseAdmin.from('enrollments').delete().eq('id', enrollmentId)
      }
      if (tempCourseId) {
        await supabaseAdmin.from('courses').delete().eq('id', tempCourseId)
      }
    })

    it('debe actualizar el progreso de la inscripción', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .put(`/api/enrollments/${enrollmentId}/progress`)
        .send({
          progress: 50,
        })

      expect(res.status).toBe(200)
      expect(res.body.message).toContain('actualizado exitosamente')
      expect(res.body.enrollment.progress).toBe(50)
      expect(res.body.enrollment.status).toBe('active')
    })

    it('debe marcar como completado al llegar a 100%', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .put(`/api/enrollments/${enrollmentId}/progress`)
        .send({
          progress: 100,
        })

      expect(res.status).toBe(200)
      expect(res.body.enrollment.progress).toBe(100)
      expect(res.body.enrollment.status).toBe('completed')
      expect(res.body.enrollment.completed_at).toBeTruthy()
    })

    it('debe fallar con progreso inválido', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .put(`/api/enrollments/${enrollmentId}/progress`)
        .send({
          progress: 150,
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('entre 0 y 100')
    })

    it('debe fallar sin autenticación', async () => {
      const res = await request(app)
        .put(`/api/enrollments/${enrollmentId}/progress`)
        .send({
          progress: 75,
        })

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/courses/:courseId/students', () => {
    it('debe obtener estudiantes del curso (teacher)', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .get(`/api/courses/${testCourseId}/students`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
      expect(res.body[0]).toHaveProperty('student')
      expect(res.body[0].student).toHaveProperty('name')
      expect(res.body[0].student).toHaveProperty('email')
    })

    it('debe fallar si no es el profesor del curso', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .get(`/api/courses/${testCourseId}/students`)

      expect(res.status).toBe(403)
    })

    it('debe fallar sin autenticación', async () => {
      const res = await request(app).get(`/api/courses/${testCourseId}/students`)

      expect(res.status).toBe(401)
    })
  })

  describe('DELETE /api/enrollments/:id', () => {
    let enrollmentId: string
    let tempCourseId: string

    beforeEach(async () => {
      // Crear curso temporal para cada test
      const course = await createTestCourse({
        teacher_id: teacherUserId,
        title: `Test Course for Cancel ${Date.now()}`,
      })
      tempCourseId = course.id

      // Crear enrollment para cancelar
      const enrollment = await createTestEnrollment({
        app,
        studentToken,
        course_id: tempCourseId,
      })
      enrollmentId = enrollment.id
    })

    afterEach(async () => {
      // Limpiar curso y enrollment temporal
      if (tempCourseId) {
        await supabaseAdmin.from('enrollments').delete().eq('course_id', tempCourseId)
        await supabaseAdmin.from('courses').delete().eq('id', tempCourseId)
      }
    })

    it('debe cancelar una inscripción', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .delete(`/api/enrollments/${enrollmentId}`)

      expect(res.status).toBe(200)
      expect(res.body.message).toContain('cancelada exitosamente')
      expect(res.body.enrollment.status).toBe('cancelled')
    })

    it('debe ser idempotente al cancelar de nuevo', async () => {
      // Cancelar primera vez
      await authenticatedRequest(app, studentToken)
        .delete(`/api/enrollments/${enrollmentId}`)

      // Intentar cancelar de nuevo (debe ser idempotente)
      const res = await authenticatedRequest(app, studentToken)
        .delete(`/api/enrollments/${enrollmentId}`)

      expect(res.status).toBe(200)
      expect(res.body.message).toContain('ya estaba cancelada')
    })

    it('debe fallar sin autenticación', async () => {
      const res = await request(app).delete(`/api/enrollments/${enrollmentId}`)

      expect(res.status).toBe(401)
    })
  })
})
