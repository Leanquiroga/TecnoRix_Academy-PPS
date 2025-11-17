import request from 'supertest'
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import app from '../app'
import { supabaseAdmin } from '../config/supabase'

function randomEmail() {
  return `teacher_${Math.floor(Math.random() * 1e8)}@mail.com`
}

const testPassword = 'test1234'
let adminToken: string
let studentToken: string
let testTeacherId: string
let testCredentialId: string

// Mock de URL de Cloudinary válida
const mockCloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/sample.pdf'

// Aumentar timeout global del suite
jest.setTimeout(30000)

describe('Teacher Application Endpoints', () => {
  beforeAll(async () => {
    // Crear admin para tests
    const adminEmail = randomEmail()
    const resAdmin = await request(app)
      .post('/api/auth/register')
      .send({ email: adminEmail, password: testPassword, name: 'Admin User', role: 'student' })
    
    const adminId = resAdmin.body.data.user.id
    
    // Actualizar a admin en BD
    await supabaseAdmin
      .from('users')
      .update({ role: 'admin', status: 'active' })
      .eq('id', adminId)

    // Login de nuevo para obtener token con role correcto
    const resAdminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: testPassword })
    
    adminToken = resAdminLogin.body.data.token

    // Crear estudiante para tests
    const studentEmail = randomEmail()
    const resStudent = await request(app)
      .post('/api/auth/register')
      .send({ email: studentEmail, password: testPassword, name: 'Student User', role: 'student' })
    
    studentToken = resStudent.body.data.token
  })

  afterAll(async () => {
    // Cleanup: eliminar datos de prueba
    if (testTeacherId) {
      await supabaseAdmin.from('users').delete().eq('id', testTeacherId)
    }
  })

  // ============================================
  // POST /api/teacher/application
  // ============================================

  describe('POST /api/teacher/application', () => {
    it('crea solicitud de profesor con datos válidos', async () => {
      const teacherEmail = randomEmail()
      const res = await request(app)
        .post('/api/teacher/application')
        .send({
          name: 'John Teacher',
          email: teacherEmail,
          password: testPassword,
          phone: '+1234567890',
          headline: 'Senior Software Engineer',
          bio: 'A' + 'b'.repeat(149), // 150 caracteres
          years_experience: 10,
          linkedin_url: 'https://linkedin.com/in/johnteacher',
          credentials: [
            {
              credential_type: 'degree',
              institution: 'MIT',
              document_url: mockCloudinaryUrl,
              year_obtained: 2010
            }
          ]
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.user_id).toBeTruthy()
      expect(res.body.data.email).toBe(teacherEmail)
      expect(res.body.data.status).toBe('pending_validation')
      expect(res.body.message).toMatch(/48-72 horas/i)

      // Guardar ID para tests posteriores
      testTeacherId = res.body.data.user_id
    })

    it('rechaza email duplicado', async () => {
      const duplicateEmail = randomEmail()
      
      // Crear primera solicitud
      await request(app)
        .post('/api/teacher/application')
        .send({
          name: 'First Teacher',
          email: duplicateEmail,
          password: testPassword,
          phone: '+1234567890',
          headline: 'Senior Software Engineer',
          bio: 'A' + 'b'.repeat(149),
          years_experience: 10,
          credentials: [
            {
              credential_type: 'degree',
              institution: 'MIT',
              document_url: mockCloudinaryUrl,
              year_obtained: 2010
            }
          ]
        })

      // Intentar duplicado
      const res = await request(app)
        .post('/api/teacher/application')
        .send({
          name: 'Second Teacher',
          email: duplicateEmail,
          password: testPassword,
          phone: '+1234567890',
          headline: 'Senior Software Engineer',
          bio: 'A' + 'b'.repeat(149),
          years_experience: 10,
          credentials: [
            {
              credential_type: 'degree',
              institution: 'MIT',
              document_url: mockCloudinaryUrl,
              year_obtained: 2010
            }
          ]
        })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('rechaza bio demasiado corta', async () => {
      const res = await request(app)
        .post('/api/teacher/application')
        .send({
          name: 'John Teacher',
          email: randomEmail(),
          password: testPassword,
          phone: '+1234567890',
          headline: 'Senior Software Engineer',
          bio: 'Too short', // Menos de 150 caracteres
          years_experience: 10,
          credentials: [
            {
              credential_type: 'degree',
              institution: 'MIT',
              document_url: mockCloudinaryUrl,
              year_obtained: 2010
            }
          ]
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/150 y 500 caracteres/i)
    })

    it('rechaza años de experiencia inválidos', async () => {
      const res = await request(app)
        .post('/api/teacher/application')
        .send({
          name: 'John Teacher',
          email: randomEmail(),
          password: testPassword,
          phone: '+1234567890',
          headline: 'Senior Software Engineer',
          bio: 'A' + 'b'.repeat(149),
          years_experience: 60, // Mayor a 50
          credentials: [
            {
              credential_type: 'degree',
              institution: 'MIT',
              document_url: mockCloudinaryUrl,
              year_obtained: 2010
            }
          ]
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/entre 0 y 50/i)
    })

    it('rechaza LinkedIn URL inválida', async () => {
      const res = await request(app)
        .post('/api/teacher/application')
        .send({
          name: 'John Teacher',
          email: randomEmail(),
          password: testPassword,
          phone: '+1234567890',
          headline: 'Senior Software Engineer',
          bio: 'A' + 'b'.repeat(149),
          years_experience: 10,
          linkedin_url: 'https://facebook.com/invalid',
          credentials: [
            {
              credential_type: 'degree',
              institution: 'MIT',
              document_url: mockCloudinaryUrl,
              year_obtained: 2010
            }
          ]
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/LinkedIn inválida/i)
    })

    it('rechaza solicitud sin credenciales', async () => {
      const res = await request(app)
        .post('/api/teacher/application')
        .send({
          name: 'John Teacher',
          email: randomEmail(),
          password: testPassword,
          phone: '+1234567890',
          headline: 'Senior Software Engineer',
          bio: 'A' + 'b'.repeat(149),
          years_experience: 10,
          credentials: []
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/al menos 1 credencial/i)
    })

    it('rechaza documento que no es de Cloudinary', async () => {
      const res = await request(app)
        .post('/api/teacher/application')
        .send({
          name: 'John Teacher',
          email: randomEmail(),
          password: testPassword,
          phone: '+1234567890',
          headline: 'Senior Software Engineer',
          bio: 'A' + 'b'.repeat(149),
          years_experience: 10,
          credentials: [
            {
              credential_type: 'degree',
              institution: 'MIT',
              document_url: 'https://example.com/fake.pdf', // No es Cloudinary
              year_obtained: 2010
            }
          ]
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/Cloudinary/i)
    })
  })

  // ============================================
  // GET /api/teacher/application/:id
  // ============================================

  describe('GET /api/teacher/application/:id', () => {
    it('retorna estado de solicitud propia', async () => {
      // Crear profesor y obtener su token
      const teacherEmail = randomEmail()
      const resCreate = await request(app)
        .post('/api/teacher/application')
        .send({
          name: 'Jane Teacher',
          email: teacherEmail,
          password: testPassword,
          phone: '+1234567890',
          headline: 'Data Scientist',
          bio: 'C' + 'd'.repeat(149),
          years_experience: 5,
          credentials: [
            {
              credential_type: 'certification',
              institution: 'Coursera',
              document_url: mockCloudinaryUrl,
              year_obtained: 2020
            }
          ]
        })

      const teacherId = resCreate.body.data.user_id

      // Login como teacher (pending)
      const resLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: teacherEmail, password: testPassword })

      const teacherToken = resLogin.body.data.token

      // Obtener estado
      const res = await request(app)
        .get(`/api/teacher/application/${teacherId}`)
        .set('Authorization', `Bearer ${teacherToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toBe('pending_validation')
      expect(res.body.data.credentials).toHaveLength(1)
      expect(res.body.data.can_be_approved).toBe(false) // No aprobado aún
    })

    it('bloquea solicitudes ajenas', async () => {
      const res = await request(app)
        .get(`/api/teacher/application/${testTeacherId}`)
        .set('Authorization', `Bearer ${studentToken}`)

      expect(res.status).toBe(403)
      expect(res.body.error).toMatch(/permiso/i)
    })

    it('admin puede ver cualquier solicitud', async () => {
      const res = await request(app)
        .get(`/api/teacher/application/${testTeacherId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  // ============================================
  // GET /api/admin/applications
  // ============================================

  describe('GET /api/admin/applications', () => {
    it('lista solicitudes pendientes para admin', async () => {
      const res = await request(app)
        .get('/api/admin/applications')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.applications).toBeInstanceOf(Array)
      expect(res.body.data.total).toBeGreaterThanOrEqual(0)
    })

    it('bloquea acceso a no-admins', async () => {
      const res = await request(app)
        .get('/api/admin/applications')
        .set('Authorization', `Bearer ${studentToken}`)

      expect(res.status).toBe(403)
    })
  })

  // ============================================
  // PUT /api/admin/credentials/:id/review
  // ============================================

  describe('PUT /api/admin/credentials/:id/review', () => {
    it('admin aprueba credencial', async () => {
      // Obtener credencial del teacher de prueba
      const { data: credentials } = await supabaseAdmin
        .from('teacher_credentials')
        .select('id')
        .eq('user_id', testTeacherId)
        .limit(1)

      testCredentialId = credentials![0].id

      const res = await request(app)
        .put(`/api/admin/credentials/${testCredentialId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          verification_status: 'approved'
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.verification_status).toBe('approved')
    })

    it('admin rechaza credencial con razón', async () => {
      // Crear nueva solicitud para rechazar
      const teacherEmail = randomEmail()
      const resCreate = await request(app)
        .post('/api/teacher/application')
        .send({
          name: 'Reject Teacher',
          email: teacherEmail,
          password: testPassword,
          phone: '+1234567890',
          headline: 'Test Engineer',
          bio: 'E' + 'f'.repeat(149),
          years_experience: 3,
          credentials: [
            {
              credential_type: 'work_experience',
              institution: 'Company X',
              document_url: mockCloudinaryUrl,
              year_obtained: 2022
            }
          ]
        })

      const rejectTeacherId = resCreate.body.data.user_id

      // Obtener credencial
      const { data: credentials } = await supabaseAdmin
        .from('teacher_credentials')
        .select('id')
        .eq('user_id', rejectTeacherId)
        .limit(1)

      const credentialId = credentials![0].id

      const res = await request(app)
        .put(`/api/admin/credentials/${credentialId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          verification_status: 'rejected',
          rejection_reason: 'Documento ilegible'
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.verification_status).toBe('rejected')
      expect(res.body.data.rejection_reason).toBe('Documento ilegible')
    })

    it('rechaza sin razón al rechazar', async () => {
      const res = await request(app)
        .put(`/api/admin/credentials/${testCredentialId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          verification_status: 'rejected'
          // Falta rejection_reason
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/rejection_reason/i)
    })

    it('bloquea a no-admins', async () => {
      const res = await request(app)
        .put(`/api/admin/credentials/${testCredentialId}/review`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          verification_status: 'approved'
        })

      expect(res.status).toBe(403)
    })
  })

  // ============================================
  // PUT /api/admin/applications/:id/approve
  // ============================================

  describe('PUT /api/admin/applications/:id/approve', () => {
    it('admin aprueba profesor completo', async () => {
      const res = await request(app)
        .put(`/api/admin/applications/${testTeacherId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toMatch(/aprobado exitosamente/i)

      // Verificar que status cambió a active
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('status')
        .eq('id', testTeacherId)
        .single()

      expect(user!.status).toBe('active')
    })

    it('rechaza aprobar profesor sin credenciales aprobadas', async () => {
      // Crear teacher sin credenciales aprobadas
      const teacherEmail = randomEmail()
      const resCreate = await request(app)
        .post('/api/teacher/application')
        .send({
          name: 'Unapproved Teacher',
          email: teacherEmail,
          password: testPassword,
          phone: '+1234567890',
          headline: 'Junior Dev',
          bio: 'G' + 'h'.repeat(149),
          years_experience: 1,
          credentials: [
            {
              credential_type: 'degree',
              institution: 'University',
              document_url: mockCloudinaryUrl,
              year_obtained: 2023
            }
          ]
        })

      const unapprovedTeacherId = resCreate.body.data.user_id

      // Intentar aprobar sin aprobar credenciales primero
      const res = await request(app)
        .put(`/api/admin/applications/${unapprovedTeacherId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/al menos 1 credencial aprobada/i)
    })

    it('bloquea a no-admins', async () => {
      const res = await request(app)
        .put(`/api/admin/applications/${testTeacherId}/approve`)
        .set('Authorization', `Bearer ${studentToken}`)

      expect(res.status).toBe(403)
    })
  })
})
