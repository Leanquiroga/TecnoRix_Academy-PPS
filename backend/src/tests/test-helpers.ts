import request from 'supertest'
import { Express } from 'express'
import { supabaseAdmin } from '../config/supabase'

/**
 * Genera email aleatorio para tests
 */
export function randomEmail(prefix = 'test') {
  return `${prefix}_${Math.floor(Math.random() * 1e8)}@mail.com`
}

/**
 * Crea un teacher directamente en BD (bypassing el nuevo flujo de aplicación)
 * Útil para tests que necesitan un teacher activo
 */
export async function createTestTeacher(input?: {
  email?: string
  name?: string
  password?: string
  status?: 'active' | 'pending_validation' | 'suspended'
}) {
  const email = input?.email || randomEmail('teacher')
  const password = input?.password || 'test1234'
  const name = input?.name || 'Test Teacher'
  const status = input?.status || 'active'

  // Crear en Supabase Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authUser.user) {
    throw new Error(`Failed to create auth user: ${authError?.message}`)
  }

  // Crear perfil en users
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .insert({
      auth_user_id: authUser.user.id,
      email,
      name,
      role: 'teacher',
      status,
    })
    .select()
    .single()

  if (userError || !user) {
    throw new Error(`Failed to create user profile: ${userError?.message}`)
  }

  return { user, password }
}

/**
 * Helper para hacer requests autenticados
 * Crea un agente de supertest con el header de autorización preconfigurado
 */
export function authenticatedRequest(app: Express, token: string) {
  const agent = request.agent(app)
  agent.set('Authorization', `Bearer ${token}`)
  return agent
}

/**
 * Factory para crear cursos de test
 */
export interface TestCourseInput {
  teacher_id: string
  title?: string
  description?: string
  status?: 'pending_approval' | 'approved' | 'rejected'
  price?: number
  level?: 'beginner' | 'intermediate' | 'advanced'
}

export async function createTestCourse(input: TestCourseInput) {
  const { data, error } = await supabaseAdmin
    .from('courses')
    .insert({
      title: input.title || `Test Course ${Date.now()}`,
      description: input.description || 'Test course description',
      teacher_id: input.teacher_id,
      status: input.status || 'approved',
      price: input.price ?? 0,
      level: input.level || 'beginner',
      created_by: input.teacher_id,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to create test course: ${error?.message || 'Unknown error'}`)
  }

  return data
}

/**
 * Factory para crear enrollments de test
 */
export interface TestEnrollmentInput {
  app: Express
  studentToken: string
  course_id: string
}

export async function createTestEnrollment(input: TestEnrollmentInput) {
  const res = await authenticatedRequest(input.app, input.studentToken)
    .post('/api/enrollments')
    .send({ course_id: input.course_id })

  if (!res.body.enrollment?.id) {
    throw new Error(`Failed to create test enrollment: ${JSON.stringify(res.body)}`)
  }

  return res.body.enrollment
}

/**
 * Helper para validar estructura de enrollment
 */
export interface EnrollmentResponse {
  id: string
  student_id: string
  course_id: string
  status: 'active' | 'pending_payment' | 'completed' | 'cancelled'
  progress: number
  enrolled_at: string
  completed_at?: string
  created_at: string
  updated_at: string
}

/**
 * Helper para validar estructura de enrollment con curso
 */
export interface EnrollmentWithCourseResponse extends EnrollmentResponse {
  course: {
    id: string
    title: string
    description?: string
    teacher_id: string
    price: number
    level?: string
  }
}
