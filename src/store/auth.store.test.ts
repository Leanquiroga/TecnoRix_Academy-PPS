import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from './auth.store'
import * as AuthAPI from '../api/auth.service'
import { setAuthToken } from '../api/http'

vi.mock('../api/auth.service')
vi.mock('../api/http', () => {
  return {
    setAuthToken: vi.fn(),
  }
})

const user = {
  id: 'u1',
  email: 'test@example.com',
  name: 'Test',
  role: 'student' as const,
  status: 'active' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('auth.store', () => {
  beforeEach(() => {
    // resetear estado del store
    const { getState, setState } = useAuthStore
    const initial = getState()
    setState({ ...initial, user: null, token: null, isAuthenticated: false, loading: false, error: undefined })
    vi.clearAllMocks()
    // limpiar storage persistido
    localStorage.clear()
  })

  it('login establece user y token', async () => {
    vi.spyOn(AuthAPI, 'login').mockResolvedValue({ user, token: 'abc' })
  const { login } = useAuthStore.getState()
  await login({ email: 'test@example.com', password: '123456' })
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user?.email).toBe('test@example.com')
    expect(state.token).toBe('abc')
    expect(setAuthToken).toHaveBeenCalledWith('abc')
  })

  it('register establece user y token', async () => {
    vi.spyOn(AuthAPI, 'register').mockResolvedValue({ user, token: 'xyz' })
    const { register } = useAuthStore.getState()
    await register({ name: 'Test', email: 'test@example.com', password: '123456', role: 'student' })
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.token).toBe('xyz')
    expect(setAuthToken).toHaveBeenCalledWith('xyz')
  })

  it('register de teacher deja estado pending_validation', async () => {
    vi.spyOn(AuthAPI, 'register').mockResolvedValue({
      user: { ...user, role: 'teacher', status: 'pending_validation' },
      token: 'tch'
    })
    const { register } = useAuthStore.getState()
    await register({ name: 'Prof', email: 't@a.com', password: '123456', role: 'teacher' })
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user?.role).toBe('teacher')
    expect(state.user?.status).toBe('pending_validation')
  })

  it('logout limpia estado y token', () => {
    useAuthStore.setState({ user, token: 'abc', isAuthenticated: true })
    const { logout } = useAuthStore.getState()
    logout()
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(setAuthToken).toHaveBeenCalledWith(null)
  })

  it('validateToken sin token desautentica', async () => {
    const { validateToken } = useAuthStore.getState()
    await validateToken()
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
  })

  it('validateToken con token obtiene perfil', async () => {
    useAuthStore.setState({ token: 'abc', isAuthenticated: true })
    vi.spyOn(AuthAPI, 'me').mockResolvedValue(user)
    const { validateToken } = useAuthStore.getState()
    await validateToken()
    const state = useAuthStore.getState()
    expect(state.user?.id).toBe('u1')
    expect(state.isAuthenticated).toBe(true)
  })
})
