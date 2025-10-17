import request from 'supertest'
import { describe, it, expect, beforeAll } from '@jest/globals'
import app from '../app'

function randomEmail() {
  return `testuser_${Math.floor(Math.random() * 1e8)}@mail.com`
}

const testPassword = 'test1234'
const testName = 'Test User'
const testRole = 'student'
let testEmail: string
let token: string

describe('Auth endpoints', () => {
  it('rechaza login de usuario suspendido', async () => {
    // 1. Registrar usuario
    const suspendedEmail = randomEmail()
    const resRegister = await request(app)
      .post('/api/auth/register')
      .send({ email: suspendedEmail, password: testPassword, name: testName, role: testRole })
    expect(resRegister.status).toBe(201)
    // 2. Suspender usuario en la base de datos
    // Usar import dinámico para ESM
  const { supabaseAdmin } = await import('../config/supabase')
    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update({ status: 'suspended' })
      .eq('email', suspendedEmail)
      .select()
  expect(error).toBeNull()
  expect(updated).not.toBeNull()
  expect((updated!)[0].status).toBe('suspended')
    // 3. Intentar login
    const resLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: suspendedEmail, password: testPassword })
    expect(resLogin.status).toBe(403)
    expect(resLogin.body.success).toBe(false)
    expect(resLogin.body.error).toMatch(/suspendido/i)
  })
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret'
  })

  it('registers a new user', async () => {
    testEmail = randomEmail()
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword, name: testName, role: testRole })
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.user.email).toBe(testEmail)
    expect(res.body.data.token).toBeTruthy()
    token = res.body.data.token
  })

  it('fails to register duplicate user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword, name: testName, role: testRole })
    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
  })

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBeTruthy()
  })

  it('fails login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'wrongpass' })
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('gets current user with token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.email).toBe(testEmail)
  })

  it('fails to get current user without token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('refreshes token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBeTruthy()
  })
})
