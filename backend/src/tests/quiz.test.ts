/**
 * Tests para el sistema de quizzes y evaluaciones
 */

import request from 'supertest'
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import app from '../app'
import { supabaseAdmin } from '../config/supabase'
import { UserRole } from '../types/auth.types'
import { QuestionType } from '../types/quiz.types'
import { authenticatedRequest, createTestCourse } from './test-helpers'

// Variables globales para los tests
let studentToken: string
let studentUserId: string
let teacherToken: string
let teacherUserId: string
let adminToken: string
let adminUserId: string
let courseId: string
let quizId: string
let attemptId: string

// Aumentar timeout global del suite
jest.setTimeout(30000)

describe('Quiz System', () => {
  beforeAll(async () => {
    console.time('[beforeAll] quiz setup')

    // Crear estudiante
    const studentEmail = `quiz-student-${Date.now()}@test.com`
    const studentRegister = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Quiz Student',
        email: studentEmail,
        password: 'password123',
        role: UserRole.STUDENT,
      })
    
    if (studentRegister.status !== 201) {
      console.error('❌ Error al registrar estudiante:', {
        status: studentRegister.status,
        body: studentRegister.body,
        email: studentEmail
      })
      throw new Error(`Failed to register student: ${JSON.stringify(studentRegister.body)}`)
    }
    
    studentUserId = studentRegister.body.data.user.id
    studentToken = studentRegister.body.data.token

    // Crear profesor
    const teacherEmail = `quiz-teacher-${Date.now()}@test.com`
    const teacherRegister = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Quiz Teacher',
        email: teacherEmail,
        password: 'password123',
        role: UserRole.TEACHER,
      })
    teacherUserId = teacherRegister.body.data.user.id
    teacherToken = teacherRegister.body.data.token

    // Crear admin
    const adminEmail = `quiz-admin-${Date.now()}@test.com`
    const adminRegister = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Quiz Admin',
        email: adminEmail,
        password: 'password123',
        role: UserRole.ADMIN,
      })
    adminUserId = adminRegister.body.data.user.id
    adminToken = adminRegister.body.data.token

    // Aprobar al profesor
    await supabaseAdmin
      .from('users')
      .update({ status: 'active' })
      .eq('id', teacherUserId)

    // Crear curso
    const course = await createTestCourse({
      teacher_id: teacherUserId,
      title: `Quiz Test Course ${Date.now()}`,
      status: 'approved',
    })
    courseId = course.id

    // Inscribir al estudiante
    await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course_id: courseId })

    // Crear un quiz de prueba para los tests
    const quizRes = await request(app)
      .post(`/api/courses/${courseId}/quizzes`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'JavaScript Básico',
        description: 'Quiz de introducción a JavaScript',
        passing_score: 70,
        time_limit_minutes: 30,
        max_attempts: 3,
        questions: [
          {
            question_text: '¿Qué es JavaScript?',
            type: QuestionType.MULTIPLE_CHOICE,
            points: 10,
            explanation: 'JavaScript es un lenguaje de programación interpretado',
            options: [
              { option_text: 'Un lenguaje de programación', is_correct: true },
              { option_text: 'Una base de datos', is_correct: false },
              { option_text: 'Un framework CSS', is_correct: false },
            ],
          },
          {
            question_text: '¿JavaScript es tipado dinámicamente?',
            type: QuestionType.TRUE_FALSE,
            points: 5,
            options: [
              { option_text: 'Verdadero', is_correct: true },
              { option_text: 'Falso', is_correct: false },
            ],
          },
        ],
      })
    
    if (quizRes.status === 201 && quizRes.body.data) {
      quizId = quizRes.body.data.id
      console.log(`[beforeAll] Quiz creado exitosamente con ID: ${quizId}`)
    } else {
      console.error('[beforeAll] Error al crear quiz:', quizRes.status, quizRes.body)
    }

    console.timeEnd('[beforeAll] quiz setup')
  })

  afterAll(async () => {
    console.log('[afterAll] Limpiando datos de prueba de quizzes...')
    
    // Limpiar en orden
    if (quizId) {
      await supabaseAdmin.from('student_answers').delete().match({})
      await supabaseAdmin.from('quiz_attempts').delete().eq('quiz_id', quizId)
      await supabaseAdmin.from('question_options').delete().match({})
      await supabaseAdmin.from('questions').delete().eq('quiz_id', quizId)
      await supabaseAdmin.from('quizzes').delete().eq('id', quizId)
    }
    
    if (courseId) {
      await supabaseAdmin.from('enrollments').delete().eq('course_id', courseId)
      await supabaseAdmin.from('courses').delete().eq('id', courseId)
    }
    
    if (studentUserId) {
      await supabaseAdmin.from('users').delete().eq('id', studentUserId)
    }
    
    if (teacherUserId) {
      await supabaseAdmin.from('users').delete().eq('id', teacherUserId)
    }
    
    if (adminUserId) {
      await supabaseAdmin.from('users').delete().eq('id', adminUserId)
    }
  })

  describe('POST /api/courses/:courseId/quizzes', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseId}/quizzes`)
        .send({
          title: 'Test Quiz',
          passing_score: 70,
          questions: [],
        })

      expect(res.status).toBe(401)
    })

    it('debe rechazar si el usuario es estudiante', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .post(`/api/courses/${courseId}/quizzes`)
        .send({
          title: 'Test Quiz',
          passing_score: 70,
          questions: [],
        })

      expect(res.status).toBe(403)
      expect(res.body.error).toContain('profesores')
    })

    it('debe validar campos requeridos', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .post(`/api/courses/${courseId}/quizzes`)
        .send({})

      expect(res.status).toBe(400)
    })

    it('debe validar que el título tenga al menos 3 caracteres', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .post(`/api/courses/${courseId}/quizzes`)
        .send({
          title: 'Ab',
          passing_score: 70,
          questions: [
            {
              question_text: '¿Qué es JavaScript?',
              type: QuestionType.MULTIPLE_CHOICE,
              points: 10,
              options: [
                { option_text: 'Un lenguaje de programación', is_correct: true },
                { option_text: 'Una base de datos', is_correct: false },
              ],
            },
          ],
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('título')
    })

    it('debe validar que passing_score esté entre 0 y 100', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .post(`/api/courses/${courseId}/quizzes`)
        .send({
          title: 'Test Quiz',
          passing_score: 150,
          questions: [
            {
              question_text: '¿Qué es JavaScript?',
              type: QuestionType.MULTIPLE_CHOICE,
              points: 10,
              options: [
                { option_text: 'Un lenguaje de programación', is_correct: true },
                { option_text: 'Una base de datos', is_correct: false },
              ],
            },
          ],
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('nota de aprobación')
    })

    it('debe validar que haya al menos una pregunta', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .post(`/api/courses/${courseId}/quizzes`)
        .send({
          title: 'Test Quiz',
          passing_score: 70,
          questions: [],
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('al menos una pregunta')
    })

    it('debe validar que cada pregunta tenga al menos 5 caracteres', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .post(`/api/courses/${courseId}/quizzes`)
        .send({
          title: 'Test Quiz',
          passing_score: 70,
          questions: [
            {
              question_text: '¿Qué?',
              type: QuestionType.MULTIPLE_CHOICE,
              points: 10,
              options: [
                { option_text: 'Opción 1', is_correct: true },
                { option_text: 'Opción 2', is_correct: false },
              ],
            },
          ],
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('al menos 5 caracteres')
    })

    it('debe validar que cada pregunta tenga al menos 2 opciones', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .post(`/api/courses/${courseId}/quizzes`)
        .send({
          title: 'Test Quiz',
          passing_score: 70,
          questions: [
            {
              question_text: '¿Qué es JavaScript?',
              type: QuestionType.MULTIPLE_CHOICE,
              points: 10,
              options: [
                { option_text: 'Un lenguaje de programación', is_correct: true },
              ],
            },
          ],
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('al menos 2 opciones')
    })

    it('debe validar que haya al menos una opción correcta', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .post(`/api/courses/${courseId}/quizzes`)
        .send({
          title: 'Test Quiz',
          passing_score: 70,
          questions: [
            {
              question_text: '¿Qué es JavaScript?',
              type: QuestionType.MULTIPLE_CHOICE,
              points: 10,
              options: [
                { option_text: 'Opción 1', is_correct: false },
                { option_text: 'Opción 2', is_correct: false },
              ],
            },
          ],
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('opción correcta')
    })

    it('debe validar que multiple_choice tenga solo una respuesta correcta', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .post(`/api/courses/${courseId}/quizzes`)
        .send({
          title: 'Test Quiz',
          passing_score: 70,
          questions: [
            {
              question_text: '¿Qué es JavaScript?',
              type: QuestionType.MULTIPLE_CHOICE,
              points: 10,
              options: [
                { option_text: 'Opción 1', is_correct: true },
                { option_text: 'Opción 2', is_correct: true },
              ],
            },
          ],
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('una opción correcta')
    })

    it('debe crear un quiz correctamente (profesor)', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .post(`/api/courses/${courseId}/quizzes`)
        .send({
          title: 'Quiz de Node.js',
          description: 'Quiz sobre Node.js y backend',
          passing_score: 75,
          time_limit_minutes: 45,
          max_attempts: 2,
          questions: [
            {
              question_text: '¿Qué es Node.js?',
              type: QuestionType.MULTIPLE_CHOICE,
              points: 10,
              explanation: 'Node.js es un entorno de ejecución para JavaScript',
              options: [
                { option_text: 'Un entorno de ejecución de JavaScript', is_correct: true },
                { option_text: 'Una base de datos NoSQL', is_correct: false },
                { option_text: 'Un framework de frontend', is_correct: false },
              ],
            },
            {
              question_text: '¿Node.js usa el motor V8?',
              type: QuestionType.TRUE_FALSE,
              points: 5,
              options: [
                { option_text: 'Verdadero', is_correct: true },
                { option_text: 'Falso', is_correct: false },
              ],
            },
          ],
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.title).toBe('Quiz de Node.js')
      expect(res.body.data.passing_score).toBe(75)
      expect(res.body.data.questions).toHaveLength(2)
      expect(res.body.data.questions[0].options).toHaveLength(3)
      expect(res.body.message).toContain('creado')

      // Limpiar este quiz
      await supabaseAdmin.from('quizzes').delete().eq('id', res.body.data.id)
    })

    it('debe crear un quiz correctamente (admin)', async () => {
      const res = await authenticatedRequest(app, adminToken)
        .post(`/api/courses/${courseId}/quizzes`)
        .send({
          title: 'Quiz Avanzado',
          passing_score: 80,
          questions: [
            {
              question_text: '¿Qué es una promesa en JavaScript?',
              type: QuestionType.MULTIPLE_CHOICE,
              points: 10,
              options: [
                { option_text: 'Un objeto para manejo asíncrono', is_correct: true },
                { option_text: 'Una variable global', is_correct: false },
              ],
            },
          ],
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      
      // Limpiar este quiz
      await supabaseAdmin.from('quizzes').delete().eq('id', res.body.data.id)
    })
  })

  describe('GET /api/courses/:courseId/quizzes', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app).get(`/api/courses/${courseId}/quizzes`)
      expect(res.status).toBe(401)
    })

    it('debe listar quizzes del curso', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .get(`/api/courses/${courseId}/quizzes`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThan(0)
    })

    it('debe retornar array vacío si no hay quizzes', async () => {
      const emptyCourse = await createTestCourse({
        teacher_id: teacherUserId,
        title: `Empty Course ${Date.now()}`,
        status: 'approved',
      })

      const res = await authenticatedRequest(app, studentToken)
        .get(`/api/courses/${emptyCourse.id}/quizzes`)

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual([])

      await supabaseAdmin.from('courses').delete().eq('id', emptyCourse.id)
    })
  })

  describe('GET /api/quizzes/:quizId', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app).get(`/api/quizzes/${quizId}`)
      expect(res.status).toBe(401)
    })

    it('debe obtener un quiz con sus preguntas', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .get(`/api/quizzes/${quizId}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(quizId)
      expect(res.body.data.questions).toHaveLength(2)
      expect(res.body.data.questions[0].options).toBeDefined()
    })

    it('debe ocultar respuestas correctas para estudiantes', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .get(`/api/quizzes/${quizId}`)

      expect(res.status).toBe(200)
      expect(res.body.data.questions[0].options[0]).not.toHaveProperty('is_correct')
    })

    it('debe mostrar respuestas correctas para profesores', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .get(`/api/quizzes/${quizId}`)

      expect(res.status).toBe(200)
      expect(res.body.data.questions[0].options[0]).toHaveProperty('is_correct')
    })

    it('debe retornar 404 si el quiz no existe', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .get('/api/quizzes/00000000-0000-0000-0000-000000000000')

      expect(res.status).toBe(404)
    })
  })

  describe('PUT /api/quizzes/:quizId', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app)
        .put(`/api/quizzes/${quizId}`)
        .send({ title: 'Updated' })
      expect(res.status).toBe(401)
    })

    it('debe rechazar si el usuario es estudiante', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .put(`/api/quizzes/${quizId}`)
        .send({ title: 'Updated' })

      expect(res.status).toBe(403)
    })

    it('debe actualizar el quiz (profesor)', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .put(`/api/quizzes/${quizId}`)
        .send({
          title: 'JavaScript Básico - Actualizado',
          passing_score: 75,
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.title).toBe('JavaScript Básico - Actualizado')
      expect(res.body.data.passing_score).toBe(75)
    })

    it('debe validar passing_score en actualización', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .put(`/api/quizzes/${quizId}`)
        .send({ passing_score: 150 })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/quizzes/:quizId/start', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app).post(`/api/quizzes/${quizId}/start`)
      expect(res.status).toBe(401)
    })

    it('debe verificar que el usuario esté inscrito', async () => {
      // Crear un usuario no inscrito
      const noEnrolledEmail = `no-enrolled-${Date.now()}@test.com`
      const noEnrolledRegister = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'No Enrolled',
          email: noEnrolledEmail,
          password: 'password123',
          role: UserRole.STUDENT,
        })
      const noEnrolledToken = noEnrolledRegister.body.data.token
      const noEnrolledUserId = noEnrolledRegister.body.data.user.id

      const res = await authenticatedRequest(app, noEnrolledToken)
        .post(`/api/quizzes/${quizId}/start`)

      expect(res.status).toBe(403)
      expect(res.body.error).toContain('inscrito')

      await supabaseAdmin.from('users').delete().eq('id', noEnrolledUserId)
    })

    it('debe iniciar un nuevo intento correctamente', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .post(`/api/quizzes/${quizId}/start`)

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.attempt).toHaveProperty('id')
      expect(res.body.data.attempt.attempt_number).toBe(1)
      expect(res.body.data.quiz).toHaveProperty('questions')
      expect(res.body.message).toContain('iniciado')

      attemptId = res.body.data.attempt.id
    })

    it('debe incrementar el número de intento', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .post(`/api/quizzes/${quizId}/start`)

      expect(res.status).toBe(201)
      expect(res.body.data.attempt.attempt_number).toBe(2)

      // Limpiar este intento
      await supabaseAdmin.from('quiz_attempts').delete().eq('id', res.body.data.attempt.id)
    })
  })

  describe('POST /api/quiz-attempts/:attemptId/submit', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app)
        .post(`/api/quiz-attempts/${attemptId}/submit`)
        .send({ answers: [] })
      expect(res.status).toBe(401)
    })

    it('debe validar que se envíen respuestas', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .post(`/api/quiz-attempts/${attemptId}/submit`)
        .send({ answers: [] })

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('al menos una pregunta')
    })

    it('debe verificar que el intento pertenezca al usuario', async () => {
      // Crear otro estudiante
      const otherEmail = `other-student-${Date.now()}@test.com`
      const otherRegister = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Other Student',
          email: otherEmail,
          password: 'password123',
          role: UserRole.STUDENT,
        })
      const otherToken = otherRegister.body.data.token
      const otherUserId = otherRegister.body.data.user.id

      const res = await authenticatedRequest(app, otherToken)
        .post(`/api/quiz-attempts/${attemptId}/submit`)
        .send({
          answers: [
            { question_id: 'some-id', selected_option_id: 'some-option' },
          ],
        })

      expect(res.status).toBe(403)

      await supabaseAdmin.from('users').delete().eq('id', otherUserId)
    })

    it('debe enviar el quiz y calcular puntaje correctamente', async () => {
      // Iniciar un intento nuevo para este test
      const startRes = await authenticatedRequest(app, studentToken)
        .post(`/api/quizzes/${quizId}/start`)
      
      const testAttemptId = startRes.body.data.attempt.id

      // Obtener el quiz para saber las preguntas y opciones
      const quizRes = await authenticatedRequest(app, studentToken)
        .get(`/api/quizzes/${quizId}`)

      const questions = quizRes.body.data.questions
      const firstQuestion = questions[0]
      const secondQuestion = questions[1]

      // Seleccionar respuestas correctas
      const correctOption1 = firstQuestion.options.find((opt: any) => 
        opt.option_text === 'Un lenguaje de programación'
      )
      const correctOption2 = secondQuestion.options.find((opt: any) => 
        opt.option_text === 'Verdadero'
      )

      const res = await authenticatedRequest(app, studentToken)
        .post(`/api/quiz-attempts/${testAttemptId}/submit`)
        .send({
          answers: [
            { question_id: firstQuestion.id, selected_option_id: correctOption1.id },
            { question_id: secondQuestion.id, selected_option_id: correctOption2.id },
          ],
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.passed).toBe(true)
      expect(res.body.data).toHaveProperty('score')
      expect(res.body.data).toHaveProperty('percentage')
      expect(res.body.data.percentage).toBe(100)
      expect(res.body.message).toContain('Felicitaciones')
    })

    it('debe rechazar envío de intento ya enviado', async () => {
      // Crear un nuevo intento
      const startRes = await authenticatedRequest(app, studentToken)
        .post(`/api/quizzes/${quizId}/start`)
      
      const newAttemptId = startRes.body.data.attempt.id

      const quizRes = await authenticatedRequest(app, studentToken)
        .get(`/api/quizzes/${quizId}`)

      const questions = quizRes.body.data.questions

      // Primer envío (debería funcionar)
      const firstSubmit = await authenticatedRequest(app, studentToken)
        .post(`/api/quiz-attempts/${newAttemptId}/submit`)
        .send({
          answers: [
            { question_id: questions[0].id, selected_option_id: questions[0].options[0].id },
          ],
        })

      expect(firstSubmit.status).toBe(200)

      // Segundo envío (debería rechazar)
      const res = await authenticatedRequest(app, studentToken)
        .post(`/api/quiz-attempts/${newAttemptId}/submit`)
        .send({
          answers: [
            { question_id: questions[0].id, selected_option_id: questions[0].options[0].id },
          ],
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('ya ha sido enviado')
    })
  })

  describe('GET /api/quizzes/:quizId/attempts', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app).get(`/api/quizzes/${quizId}/attempts`)
      expect(res.status).toBe(401)
    })

    it('debe listar intentos del estudiante actual', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .get(`/api/quizzes/${quizId}/attempts`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThan(0)
    })

    it('debe listar todos los intentos para profesores', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .get(`/api/quizzes/${quizId}/attempts`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe('GET /api/quiz-attempts/:attemptId', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app).get(`/api/quiz-attempts/${attemptId}`)
      expect(res.status).toBe(401)
    })

    it('debe obtener detalles del intento', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .get(`/api/quiz-attempts/${attemptId}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(attemptId)
      expect(res.body.data).toHaveProperty('answers')
    })

    it('debe rechazar si el intento no pertenece al estudiante', async () => {
      const otherEmail = `other-${Date.now()}@test.com`
      const otherRegister = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Other',
          email: otherEmail,
          password: 'password123',
          role: UserRole.STUDENT,
        })
      const otherToken = otherRegister.body.data.token
      const otherUserId = otherRegister.body.data.user.id

      const res = await authenticatedRequest(app, otherToken)
        .get(`/api/quiz-attempts/${attemptId}`)

      expect(res.status).toBe(403)

      await supabaseAdmin.from('users').delete().eq('id', otherUserId)
    })
  })

  describe('GET /api/quizzes/:quizId/statistics', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app).get(`/api/quizzes/${quizId}/statistics`)
      expect(res.status).toBe(401)
    })

    it('debe rechazar si el usuario es estudiante', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .get(`/api/quizzes/${quizId}/statistics`)

      expect(res.status).toBe(403)
      expect(res.body.error).toContain('profesores')
    })

    it('debe obtener estadísticas del quiz (profesor)', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .get(`/api/quizzes/${quizId}/statistics`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('total_attempts')
      expect(res.body.data).toHaveProperty('average_score')
      expect(res.body.data).toHaveProperty('pass_rate')
      expect(res.body.data).toHaveProperty('highest_score')
      expect(res.body.data).toHaveProperty('lowest_score')
    })

    it('debe obtener estadísticas del quiz (admin)', async () => {
      const res = await authenticatedRequest(app, adminToken)
        .get(`/api/quizzes/${quizId}/statistics`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('total_attempts')
    })
  })

  describe('DELETE /api/quizzes/:quizId', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app).delete(`/api/quizzes/${quizId}`)
      expect(res.status).toBe(401)
    })

    it('debe rechazar si el usuario es estudiante', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .delete(`/api/quizzes/${quizId}`)

      expect(res.status).toBe(403)
    })

    it('debe eliminar el quiz (soft delete)', async () => {
      // Crear un quiz temporal para eliminar
      const tempQuizRes = await authenticatedRequest(app, teacherToken)
        .post(`/api/courses/${courseId}/quizzes`)
        .send({
          title: 'Quiz Temporal para Eliminar',
          passing_score: 70,
          questions: [
            {
              question_text: '¿Pregunta temporal?',
              type: QuestionType.TRUE_FALSE,
              points: 10,
              options: [
                { option_text: 'Sí', is_correct: true },
                { option_text: 'No', is_correct: false },
              ],
            },
          ],
        })

      const tempQuizId = tempQuizRes.body.data.id

      const res = await authenticatedRequest(app, teacherToken)
        .delete(`/api/quizzes/${tempQuizId}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toContain('eliminado')

      // Verificar que no aparece en listado
      const listRes = await authenticatedRequest(app, teacherToken)
        .get(`/api/courses/${courseId}/quizzes`)
      
      const deletedQuiz = listRes.body.data.find((q: any) => q.id === tempQuizId)
      expect(deletedQuiz).toBeUndefined()
    })
  })
})
