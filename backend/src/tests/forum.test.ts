/**
 * Tests para el sistema de foros
 */

import request from 'supertest'
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import app from '../app'
import { supabaseAdmin } from '../config/supabase'
import { UserRole } from '../types/auth.types'
import { authenticatedRequest, createTestCourse } from './test-helpers'

// Variables globales para los tests
let studentToken: string
let studentUserId: string
let teacherToken: string
let teacherUserId: string
let courseId: string
let postId: string
let replyId: string

// Aumentar timeout global del suite (setup crea usuarios/curso y puede tardar >5s)
jest.setTimeout(30000)

describe('Forum System', () => {
  beforeAll(async () => {
    console.time('[beforeAll] forum setup')

    // Crear estudiante
    const studentEmail = `forum-student-${Date.now()}@test.com`
    const studentRegister = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Forum Student',
        email: studentEmail,
        password: 'password123',
        role: UserRole.STUDENT,
      })
    studentUserId = studentRegister.body.data.user.id
    studentToken = studentRegister.body.data.token

    // Crear profesor
    const teacherEmail = `forum-teacher-${Date.now()}@test.com`
    const teacherRegister = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Forum Teacher',
        email: teacherEmail,
        password: 'password123',
        role: UserRole.TEACHER,
      })
    teacherUserId = teacherRegister.body.data.user.id
    teacherToken = teacherRegister.body.data.token

    // Aprobar al profesor
    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', 'admin@tecnorx.com')
      .single()

    if (adminUser) {
      await supabaseAdmin
        .from('users')
        .update({ status: 'active' })
        .eq('id', teacherUserId)
    }

    // Crear curso
    const course = await createTestCourse({
      teacher_id: teacherUserId,
      title: `Forum Test Course ${Date.now()}`,
      status: 'approved',
    })
    courseId = course.id

    // Inscribir al estudiante
    await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course_id: courseId })

    console.timeEnd('[beforeAll] forum setup')
  })

  afterAll(async () => {
    console.log('[afterAll] Limpiando datos de prueba del foro...')
    
    // Limpiar en orden (respuestas -> posts -> enrollments -> curso -> usuarios)
    if (postId) {
      await supabaseAdmin.from('forum_replies').delete().eq('post_id', postId)
      await supabaseAdmin.from('forum_posts').delete().eq('id', postId)
    }
    
    if (courseId) {
      await supabaseAdmin.from('forum_posts').delete().eq('course_id', courseId)
      await supabaseAdmin.from('enrollments').delete().eq('course_id', courseId)
      await supabaseAdmin.from('courses').delete().eq('id', courseId)
    }
    
    if (studentUserId) {
      await supabaseAdmin.from('users').delete().eq('id', studentUserId)
    }
    
    if (teacherUserId) {
      await supabaseAdmin.from('users').delete().eq('id', teacherUserId)
    }
  })

  describe('POST /api/courses/:courseId/forum', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseId}/forum`)
        .send({ title: 'Test Post', message: 'Test message' })

      expect(res.status).toBe(401)
    })

    it('debe rechazar si el usuario no está inscrito', async () => {
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
        .post(`/api/courses/${courseId}/forum`)
        .send({ title: 'Test Post', message: 'Test message' })

      expect(res.status).toBe(403)
      expect(res.body.error).toContain('acceso')

      // Limpiar
      await supabaseAdmin.from('users').delete().eq('id', noEnrolledUserId)
    })

    it('debe validar campos requeridos', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .post(`/api/courses/${courseId}/forum`)
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('requeridos')
    })

    it('debe validar longitud mínima del título', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .post(`/api/courses/${courseId}/forum`)
        .send({ title: 'abc', message: 'Test message long enough' })

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('título')
    })

    it('debe validar longitud mínima del mensaje', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .post(`/api/courses/${courseId}/forum`)
        .send({ title: 'Valid Title', message: 'short' })

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('mensaje')
    })

    it('debe crear un post correctamente (estudiante inscrito)', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .post(`/api/courses/${courseId}/forum`)
        .send({
          title: 'Mi primera pregunta',
          message: 'Tengo una duda sobre el contenido del curso',
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.title).toBe('Mi primera pregunta')
      expect(res.body.data.course_id).toBe(courseId)
      expect(res.body.data.user_id).toBe(studentUserId)
      expect(res.body.data).toHaveProperty('author')
      expect(res.body.data.author.name).toBe('Forum Student')
      expect(res.body.data.replies_count).toBe(0)

      postId = res.body.data.id
    })

    it('debe permitir al profesor crear posts', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .post(`/api/courses/${courseId}/forum`)
        .send({
          title: 'Anuncio del profesor',
          message: 'Bienvenidos al curso, pueden hacer sus preguntas aquí',
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.user_id).toBe(teacherUserId)
    })
  })

  describe('GET /api/courses/:courseId/forum', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app).get(`/api/courses/${courseId}/forum`)

      expect(res.status).toBe(401)
    })

    it('debe rechazar si el usuario no está inscrito', async () => {
      const noEnrolledEmail = `no-enrolled-2-${Date.now()}@test.com`
      const noEnrolledRegister = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'No Enrolled 2',
          email: noEnrolledEmail,
          password: 'password123',
          role: UserRole.STUDENT,
        })
      const noEnrolledToken = noEnrolledRegister.body.data.token
      const noEnrolledUserId = noEnrolledRegister.body.data.user.id

      const res = await authenticatedRequest(app, noEnrolledToken)
        .get(`/api/courses/${courseId}/forum`)

      expect(res.status).toBe(403)

      await supabaseAdmin.from('users').delete().eq('id', noEnrolledUserId)
    })

    it('debe listar posts del foro', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .get(`/api/courses/${courseId}/forum`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThan(0)
      
      // Verificar estructura del post
      const post = res.body.data[0]
      expect(post).toHaveProperty('id')
      expect(post).toHaveProperty('title')
      expect(post).toHaveProperty('message')
      expect(post).toHaveProperty('author')
      expect(post.author).toHaveProperty('name')
      expect(post).toHaveProperty('replies_count')
    })
  })

  describe('GET /api/forum/posts/:postId', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app).get(`/api/forum/posts/${postId}`)

      expect(res.status).toBe(401)
    })

    it('debe obtener un post específico', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .get(`/api/forum/posts/${postId}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(postId)
      expect(res.body.data).toHaveProperty('author')
    })

    it('debe retornar 404 para post inexistente', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const res = await authenticatedRequest(app, studentToken)
        .get(`/api/forum/posts/${fakeId}`)

      expect(res.status).toBe(404)
    })
  })

  describe('PUT /api/forum/posts/:postId', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app)
        .put(`/api/forum/posts/${postId}`)
        .send({ title: 'Updated Title' })

      expect(res.status).toBe(401)
    })

    it('debe rechazar si no es el autor', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .put(`/api/forum/posts/${postId}`)
        .send({ title: 'Trying to update' })

      expect(res.status).toBe(403)
      expect(res.body.error).toContain('permiso')
    })

    it('debe actualizar el post correctamente', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .put(`/api/forum/posts/${postId}`)
        .send({
          title: 'Título actualizado',
          message: 'Mensaje actualizado con más detalles',
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.title).toBe('Título actualizado')
    })
  })

  describe('POST /api/forum/posts/:postId/replies', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app)
        .post(`/api/forum/posts/${postId}/replies`)
        .send({ message: 'Test reply' })

      expect(res.status).toBe(401)
    })

    it('debe validar el mensaje', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .post(`/api/forum/posts/${postId}/replies`)
        .send({ message: 'ab' })

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('mensaje')
    })

    it('debe crear una respuesta correctamente', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .post(`/api/forum/posts/${postId}/replies`)
        .send({ message: 'Esta es mi respuesta a tu pregunta' })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.post_id).toBe(postId)
      expect(res.body.data.message).toBe('Esta es mi respuesta a tu pregunta')
      expect(res.body.data).toHaveProperty('author')
      expect(res.body.data.author.name).toBe('Forum Teacher')

      replyId = res.body.data.id
    })

    it('debe crear una respuesta anidada', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .post(`/api/forum/posts/${postId}/replies`)
        .send({
          message: 'Gracias por la respuesta',
          parent_reply_id: replyId,
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.parent_reply_id).toBe(replyId)
    })
  })

  describe('GET /api/forum/posts/:postId/replies', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app).get(`/api/forum/posts/${postId}/replies`)

      expect(res.status).toBe(401)
    })

    it('debe listar respuestas del post', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .get(`/api/forum/posts/${postId}/replies`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThan(0)
      
      const reply = res.body.data[0]
      expect(reply).toHaveProperty('id')
      expect(reply).toHaveProperty('message')
      expect(reply).toHaveProperty('author')
      expect(reply.author).toHaveProperty('name')
    })
  })

  describe('PUT /api/forum/replies/:replyId', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app)
        .put(`/api/forum/replies/${replyId}`)
        .send({ message: 'Updated reply' })

      expect(res.status).toBe(401)
    })

    it('debe rechazar si no es el autor', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .put(`/api/forum/replies/${replyId}`)
        .send({ message: 'Trying to update' })

      expect(res.status).toBe(403)
    })

    it('debe actualizar la respuesta correctamente', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .put(`/api/forum/replies/${replyId}`)
        .send({ message: 'Respuesta actualizada con más información' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.message).toBe('Respuesta actualizada con más información')
    })
  })

  describe('DELETE /api/forum/replies/:replyId', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app).delete(`/api/forum/replies/${replyId}`)

      expect(res.status).toBe(401)
    })

    it('debe rechazar si no es el autor', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .delete(`/api/forum/replies/${replyId}`)

      expect(res.status).toBe(403)
    })

    it('debe eliminar la respuesta correctamente', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .delete(`/api/forum/replies/${replyId}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toContain('eliminada')
    })
  })

  describe('DELETE /api/forum/posts/:postId', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app).delete(`/api/forum/posts/${postId}`)

      expect(res.status).toBe(401)
    })

    it('debe rechazar si no es el autor', async () => {
      const res = await authenticatedRequest(app, teacherToken)
        .delete(`/api/forum/posts/${postId}`)

      expect(res.status).toBe(403)
    })

    it('debe eliminar el post correctamente', async () => {
      const res = await authenticatedRequest(app, studentToken)
        .delete(`/api/forum/posts/${postId}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toContain('eliminado')

      // Verificar que el post fue eliminado
      const checkRes = await authenticatedRequest(app, studentToken)
        .get(`/api/forum/posts/${postId}`)

      expect(checkRes.status).toBe(404)
    })
  })
})
